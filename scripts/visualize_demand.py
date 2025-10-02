#!/usr/bin/env python3
"""
Demand Visualization Script - Line Graphs & Trend Analysis
==========================================================

This script creates line graphs showing:
1. Daily demand trends for 2024
2. Peak day trends across years (2016-2025)
3. Route comparison analysis
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import os

# Set style for better visualizations
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class DemandVisualizer:
    def __init__(self, data_path, output_path):
        """
        Initialize the demand visualizer
        
        Args:
            data_path (str): Path to the training data CSV
            output_path (str): Directory to save visualizations
        """
        self.data_path = data_path
        self.output_path = output_path
        os.makedirs(output_path, exist_ok=True)
        
    def load_data(self):
        """Load and prepare data for visualization"""
        print("📊 Loading data for visualization...")
        
        df = pd.read_csv(self.data_path)
        df['date'] = pd.to_datetime(df['date'])
        
        # Aggregate by date and route (sum all train types)
        self.daily_data = df.groupby(['date', 'route']).agg({
            'bookings': 'sum',
            'holiday_multiplier': 'first',
            'weekly_multiplier': 'first',
            'year': 'first',
            'month': 'first',
            'day_of_week': 'first'
        }).reset_index()
        
        # Total daily bookings across all routes
        self.total_daily = df.groupby('date').agg({
            'bookings': 'sum',
            'holiday_multiplier': 'first',
            'weekly_multiplier': 'first',
            'year': 'first',
            'month': 'first',
            'day_of_week': 'first'
        }).reset_index()
        
        print(f"✅ Data loaded: {len(self.daily_data)} route-day records")
        return df
    
    def plot_2024_trends(self):
        """Create line graphs for 2024 daily trends"""
        print("📈 Creating 2024 trend visualizations...")
        
        # Filter 2024 data
        data_2024 = self.daily_data[self.daily_data['year'] == 2024].copy()
        total_2024 = self.total_daily[self.total_daily['year'] == 2024].copy()
        
        # Create figure with subplots
        fig, axes = plt.subplots(3, 1, figsize=(16, 14))
        fig.suptitle('Train Booking Demand Trends - 2024', fontsize=20, fontweight='bold')
        
        # 1. Total daily bookings across all routes
        ax1 = axes[0]
        ax1.plot(total_2024['date'], total_2024['bookings'], 
                linewidth=2, color='#2E86AB', alpha=0.8)
        
        # Highlight peak days (holiday_multiplier > 3)
        peak_days = total_2024[total_2024['holiday_multiplier'] > 3]
        ax1.scatter(peak_days['date'], peak_days['bookings'], 
                   color='red', s=50, alpha=0.7, zorder=5, label='Peak Days')
        
        ax1.set_title('Total Daily Bookings - All Routes (2024)', fontsize=14, fontweight='bold')
        ax1.set_ylabel('Total Bookings', fontsize=12)
        ax1.grid(True, alpha=0.3)
        ax1.legend()
        
        # Add annotations for major peaks
        max_booking_day = total_2024.loc[total_2024['bookings'].idxmax()]
        ax1.annotate(f'Peak: {max_booking_day["bookings"]:,}\n{max_booking_day["date"].strftime("%Y-%m-%d")}',
                    xy=(max_booking_day['date'], max_booking_day['bookings']),
                    xytext=(10, 10), textcoords='offset points',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7),
                    arrowprops=dict(arrowstyle='->', connectionstyle='arc3,rad=0'))
        
        # 2. Top 3 routes comparison
        ax2 = axes[1]
        top_routes = ['Jakarta-Surabaya', 'Jakarta-Yogyakarta', 'Jakarta-Bandung']
        
        for route in top_routes:
            route_data = data_2024[data_2024['route'] == route]
            ax2.plot(route_data['date'], route_data['bookings'], 
                    linewidth=2, label=route, alpha=0.8)
        
        ax2.set_title('Top 3 Routes - Daily Bookings Comparison (2024)', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Daily Bookings', fontsize=12)
        ax2.grid(True, alpha=0.3)
        ax2.legend()
        
        # 3. Weekly patterns (average by day of week)
        ax3 = axes[2]
        weekly_pattern = total_2024.groupby('day_of_week')['bookings'].mean()
        day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        
        bars = ax3.bar(range(7), weekly_pattern.values, 
                      color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFE66D', '#FF8C42'])
        ax3.set_title('Average Daily Bookings by Day of Week (2024)', fontsize=14, fontweight='bold')
        ax3.set_ylabel('Average Bookings', fontsize=12)
        ax3.set_xlabel('Day of Week', fontsize=12)
        ax3.set_xticks(range(7))
        ax3.set_xticklabels(day_names)
        ax3.grid(True, alpha=0.3, axis='y')
        
        # Add value labels on bars
        for bar, value in zip(bars, weekly_pattern.values):
            height = bar.get_height()
            ax3.text(bar.get_x() + bar.get_width()/2., height + 500,
                    f'{int(value):,}', ha='center', va='bottom', fontweight='bold')
        
        plt.tight_layout()
        
        # Save the plot
        output_file = os.path.join(self.output_path, '2024_demand_trends.png')
        plt.savefig(output_file, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        
        print(f"✅ 2024 trends saved to: {output_file}")
        
        return total_2024, peak_days
    
    def plot_peak_days_yearly_trends(self):
        """Analyze and plot the busiest days from year to year"""
        print("📈 Creating yearly peak days analysis...")
        
        # Find peak days for each year (top booking day)
        yearly_peaks = []
        
        for year in range(2016, 2026):
            year_data = self.total_daily[self.total_daily['year'] == year]
            if len(year_data) > 0:
                peak_day = year_data.loc[year_data['bookings'].idxmax()]
                yearly_peaks.append({
                    'year': year,
                    'date': peak_day['date'],
                    'bookings': peak_day['bookings'],
                    'holiday_multiplier': peak_day['holiday_multiplier'],
                    'month': peak_day['month']
                })
        
        peaks_df = pd.DataFrame(yearly_peaks)
        
        # Create visualization
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Peak Day Analysis Across Years (2016-2025)', fontsize=20, fontweight='bold')
        
        # 1. Peak booking trends over years
        ax1 = axes[0, 0]
        ax1.plot(peaks_df['year'], peaks_df['bookings'], 
                marker='o', linewidth=3, markersize=8, color='#E74C3C')
        
        # Highlight COVID years
        covid_years = peaks_df[peaks_df['year'].isin([2020, 2021])]
        ax1.scatter(covid_years['year'], covid_years['bookings'], 
                   color='orange', s=100, zorder=5, label='COVID Impact')
        
        ax1.set_title('Peak Day Bookings by Year', fontsize=14, fontweight='bold')
        ax1.set_xlabel('Year', fontsize=12)
        ax1.set_ylabel('Peak Day Bookings', fontsize=12)
        ax1.grid(True, alpha=0.3)
        ax1.legend()
        
        # Add value labels
        for _, row in peaks_df.iterrows():
            ax1.annotate(f'{int(row["bookings"]):,}', 
                        xy=(row['year'], row['bookings']),
                        xytext=(0, 10), textcoords='offset points',
                        ha='center', fontweight='bold', fontsize=9)
        
        # 2. Peak day months distribution
        ax2 = axes[0, 1]
        month_counts = peaks_df['month'].value_counts().sort_index()
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        bars = ax2.bar(range(1, 13), [month_counts.get(i, 0) for i in range(1, 13)],
                      color='#3498DB', alpha=0.7)
        ax2.set_title('Peak Days by Month (2016-2025)', fontsize=14, fontweight='bold')
        ax2.set_xlabel('Month', fontsize=12)
        ax2.set_ylabel('Number of Peak Days', fontsize=12)
        ax2.set_xticks(range(1, 13))
        ax2.set_xticklabels(month_names)
        ax2.grid(True, alpha=0.3, axis='y')
        
        # 3. Holiday multiplier trends
        ax3 = axes[1, 0]
        ax3.plot(peaks_df['year'], peaks_df['holiday_multiplier'], 
                marker='s', linewidth=3, markersize=8, color='#9B59B6')
        ax3.set_title('Holiday Impact Factor for Peak Days', fontsize=14, fontweight='bold')
        ax3.set_xlabel('Year', fontsize=12)
        ax3.set_ylabel('Holiday Multiplier', fontsize=12)
        ax3.grid(True, alpha=0.3)
        
        # 4. Growth rate analysis
        ax4 = axes[1, 1]
        peaks_df['growth_rate'] = peaks_df['bookings'].pct_change() * 100
        
        # Remove first year (no growth rate) and filter extreme values
        growth_data = peaks_df[peaks_df['year'] > 2016].copy()
        
        colors = ['red' if x < 0 else 'green' for x in growth_data['growth_rate']]
        bars = ax4.bar(growth_data['year'], growth_data['growth_rate'], color=colors, alpha=0.7)
        
        ax4.set_title('Year-over-Year Growth Rate of Peak Days', fontsize=14, fontweight='bold')
        ax4.set_xlabel('Year', fontsize=12)
        ax4.set_ylabel('Growth Rate (%)', fontsize=12)
        ax4.axhline(y=0, color='black', linestyle='-', alpha=0.3)
        ax4.grid(True, alpha=0.3, axis='y')
        
        # Add value labels
        for bar, value in zip(bars, growth_data['growth_rate']):
            height = bar.get_height()
            ax4.text(bar.get_x() + bar.get_width()/2., 
                    height + (5 if height > 0 else -10),
                    f'{value:.1f}%', ha='center', va='bottom' if height > 0 else 'top',
                    fontweight='bold', fontsize=9)
        
        plt.tight_layout()
        
        # Save the plot
        output_file = os.path.join(self.output_path, 'yearly_peak_analysis.png')
        plt.savefig(output_file, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        
        print(f"✅ Yearly peak analysis saved to: {output_file}")
        
        # Print peak days summary
        print("\n📊 Peak Days Summary:")
        print("=" * 50)
        for _, peak in peaks_df.iterrows():
            print(f"{peak['year']}: {peak['date'].strftime('%Y-%m-%d')} - {int(peak['bookings']):,} bookings (Multiplier: {peak['holiday_multiplier']:.1f}x)")
        
        return peaks_df
    
    def plot_lebaran_trends(self):
        """Special analysis for Lebaran trends across years"""
        print("🌙 Creating Lebaran trend analysis...")
        
        # Identify Lebaran periods (high holiday multiplier days)
        lebaran_data = self.total_daily[self.total_daily['holiday_multiplier'] > 6].copy()
        
        if len(lebaran_data) == 0:
            print("⚠️  No Lebaran data found (holiday_multiplier > 6)")
            return
        
        # Group by year
        lebaran_yearly = lebaran_data.groupby('year').agg({
            'bookings': ['max', 'mean', 'sum'],
            'date': 'count'
        }).round(0)
        
        lebaran_yearly.columns = ['Peak_Bookings', 'Avg_Bookings', 'Total_Bookings', 'Days_Count']
        lebaran_yearly = lebaran_yearly.reset_index()
        
        # Create visualization
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Lebaran Period Analysis (2016-2025)', fontsize=20, fontweight='bold')
        
        # 1. Peak Lebaran bookings by year
        ax1 = axes[0, 0]
        line1 = ax1.plot(lebaran_yearly['year'], lebaran_yearly['Peak_Bookings'], 
                        marker='o', linewidth=3, markersize=8, color='#E67E22', label='Peak Day')
        ax1.set_title('Peak Lebaran Bookings by Year', fontsize=14, fontweight='bold')
        ax1.set_ylabel('Peak Bookings', fontsize=12, color='#E67E22')
        ax1.tick_params(axis='y', labelcolor='#E67E22')
        ax1.grid(True, alpha=0.3)
        
        # Add second y-axis for average
        ax1_twin = ax1.twinx()
        line2 = ax1_twin.plot(lebaran_yearly['year'], lebaran_yearly['Avg_Bookings'], 
                             marker='s', linewidth=2, markersize=6, color='#27AE60', label='Average')
        ax1_twin.set_ylabel('Average Bookings', fontsize=12, color='#27AE60')
        ax1_twin.tick_params(axis='y', labelcolor='#27AE60')
        
        # Combined legend
        lines = line1 + line2
        labels = [l.get_label() for l in lines]
        ax1.legend(lines, labels, loc='upper left')
        
        # 2. Total Lebaran period bookings
        ax2 = axes[0, 1]
        bars = ax2.bar(lebaran_yearly['year'], lebaran_yearly['Total_Bookings'], 
                      color='#8E44AD', alpha=0.7)
        ax2.set_title('Total Lebaran Period Bookings', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Total Bookings', fontsize=12)
        ax2.grid(True, alpha=0.3, axis='y')
        
        # Add value labels
        for bar in bars:
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                    f'{int(height):,}', ha='center', va='bottom', fontweight='bold', fontsize=9)
        
        # 3. Lebaran days count by year
        ax3 = axes[1, 0]
        ax3.bar(lebaran_yearly['year'], lebaran_yearly['Days_Count'], 
               color='#F39C12', alpha=0.7)
        ax3.set_title('Number of High-Demand Lebaran Days', fontsize=14, fontweight='bold')
        ax3.set_xlabel('Year', fontsize=12)
        ax3.set_ylabel('Days Count', fontsize=12)
        ax3.grid(True, alpha=0.3, axis='y')
        
        # 4. Daily Lebaran pattern (all years combined)
        ax4 = axes[1, 1]
        
        # Create relative day index (days before/after peak)
        yearly_peaks = lebaran_data.groupby('year')['bookings'].idxmax()
        lebaran_pattern = []
        
        for year in lebaran_yearly['year']:
            if year in yearly_peaks.index:
                peak_idx = yearly_peaks[year]
                peak_date = self.total_daily.loc[peak_idx, 'date']
                year_lebaran = lebaran_data[lebaran_data['year'] == year].copy()
                year_lebaran['days_from_peak'] = (year_lebaran['date'] - peak_date).dt.days
                lebaran_pattern.append(year_lebaran[['days_from_peak', 'bookings']])
        
        if lebaran_pattern:
            all_patterns = pd.concat(lebaran_pattern)
            pattern_avg = all_patterns.groupby('days_from_peak')['bookings'].mean().sort_index()
            
            ax4.plot(pattern_avg.index, pattern_avg.values, 
                    marker='o', linewidth=2, markersize=6, color='#C0392B')
            ax4.axvline(x=0, color='red', linestyle='--', alpha=0.7, label='Peak Day')
            ax4.set_title('Average Lebaran Booking Pattern', fontsize=14, fontweight='bold')
            ax4.set_xlabel('Days from Peak', fontsize=12)
            ax4.set_ylabel('Average Bookings', fontsize=12)
            ax4.grid(True, alpha=0.3)
            ax4.legend()
        
        plt.tight_layout()
        
        # Save the plot
        output_file = os.path.join(self.output_path, 'lebaran_trends.png')
        plt.savefig(output_file, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        
        print(f"✅ Lebaran trends saved to: {output_file}")
        
        return lebaran_yearly
    
    def create_summary_dashboard(self):
        """Create an overall summary dashboard"""
        print("📊 Creating summary dashboard...")
        
        # Key statistics
        total_bookings = self.total_daily['bookings'].sum()
        avg_daily = self.total_daily['bookings'].mean()
        peak_day = self.total_daily.loc[self.total_daily['bookings'].idxmax()]
        
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Train Booking Demand - Summary Dashboard (2016-2025)', 
                    fontsize=20, fontweight='bold')
        
        # 1. Monthly trends across all years
        monthly_avg = self.total_daily.groupby('month')['bookings'].mean()
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        ax1.plot(range(1, 13), monthly_avg.values, marker='o', linewidth=3, markersize=8, color='#3498DB')
        ax1.set_title('Average Monthly Demand Pattern', fontsize=14, fontweight='bold')
        ax1.set_xlabel('Month', fontsize=12)
        ax1.set_ylabel('Average Daily Bookings', fontsize=12)
        ax1.set_xticks(range(1, 13))
        ax1.set_xticklabels(month_names)
        ax1.grid(True, alpha=0.3)
        
        # 2. Yearly total bookings
        yearly_totals = self.total_daily.groupby('year')['bookings'].sum()
        
        bars = ax2.bar(yearly_totals.index, yearly_totals.values, color='#2ECC71', alpha=0.7)
        ax2.set_title('Total Annual Bookings', fontsize=14, fontweight='bold')
        ax2.set_xlabel('Year', fontsize=12)
        ax2.set_ylabel('Total Bookings (Millions)', fontsize=12)
        ax2.grid(True, alpha=0.3, axis='y')
        
        # Format y-axis to show millions
        ax2.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x/1e6:.1f}M'))
        
        # 3. Holiday vs Non-holiday comparison
        holiday_data = self.total_daily[self.total_daily['holiday_multiplier'] > 1.5]
        normal_data = self.total_daily[self.total_daily['holiday_multiplier'] <= 1.5]
        
        ax3.hist([normal_data['bookings'], holiday_data['bookings']], 
                bins=30, alpha=0.7, label=['Normal Days', 'Holiday Days'],
                color=['#95A5A6', '#E74C3C'])
        ax3.set_title('Booking Distribution: Normal vs Holiday Days', fontsize=14, fontweight='bold')
        ax3.set_xlabel('Daily Bookings', fontsize=12)
        ax3.set_ylabel('Frequency', fontsize=12)
        ax3.legend()
        ax3.grid(True, alpha=0.3, axis='y')
        
        # 4. Top routes performance
        route_totals = self.daily_data.groupby('route')['bookings'].sum().sort_values(ascending=True)
        
        ax4.barh(range(len(route_totals)), route_totals.values, color='#F39C12', alpha=0.7)
        ax4.set_title('Total Bookings by Route (2016-2025)', fontsize=14, fontweight='bold')
        ax4.set_xlabel('Total Bookings (Millions)', fontsize=12)
        ax4.set_yticks(range(len(route_totals)))
        ax4.set_yticklabels(route_totals.index, fontsize=10)
        ax4.grid(True, alpha=0.3, axis='x')
        
        # Format x-axis to show millions
        ax4.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x/1e6:.1f}M'))
        
        plt.tight_layout()
        
        # Save the plot
        output_file = os.path.join(self.output_path, 'summary_dashboard.png')
        plt.savefig(output_file, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        
        print(f"✅ Summary dashboard saved to: {output_file}")
        
        # Print key statistics
        print(f"\n📈 Key Statistics:")
        print(f"   Total Bookings (2016-2025): {total_bookings:,.0f}")
        print(f"   Average Daily Bookings: {avg_daily:,.0f}")
        print(f"   Peak Day: {peak_day['date'].strftime('%Y-%m-%d')} ({peak_day['bookings']:,.0f} bookings)")
        print(f"   Top Route: {route_totals.index[-1]} ({route_totals.iloc[-1]:,.0f} total bookings)")

def main():
    """Main visualization pipeline"""
    print("📊 Train Booking Demand Visualization")
    print("=" * 50)
    
    # Paths
    data_path = "/Users/macbookair/Documents/Code/hacksphrizz/data/train_booking_data_2016_2025.csv"
    output_path = "/Users/macbookair/Documents/Code/hacksphrizz/models/visualizations"
    
    # Initialize visualizer
    visualizer = DemandVisualizer(data_path, output_path)
    
    # Load data
    df = visualizer.load_data()
    
    # Create visualizations
    print("\n1. Creating 2024 trend analysis...")
    total_2024, peak_days = visualizer.plot_2024_trends()
    
    print("\n2. Creating yearly peak day analysis...")
    peaks_df = visualizer.plot_peak_days_yearly_trends()
    
    print("\n3. Creating Lebaran trend analysis...")
    lebaran_yearly = visualizer.plot_lebaran_trends()
    
    print("\n4. Creating summary dashboard...")
    visualizer.create_summary_dashboard()
    
    print(f"\n🎉 All visualizations completed!")
    print(f"📁 Saved in: {output_path}")
    print("\nGenerated files:")
    print("   • 2024_demand_trends.png")
    print("   • yearly_peak_analysis.png") 
    print("   • lebaran_trends.png")
    print("   • summary_dashboard.png")

if __name__ == "__main__":
    main()