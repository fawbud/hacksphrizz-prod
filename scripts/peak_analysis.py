#!/usr/bin/env python3
"""
Peak Days Analysis - Detailed Yearly Comparison
==============================================

This script creates detailed analysis of the busiest days across years,
showing trends and patterns in peak demand periods.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import os

class PeakDaysAnalyzer:
    def __init__(self, data_path, output_path):
        """Initialize the peak days analyzer"""
        self.data_path = data_path
        self.output_path = output_path
        os.makedirs(output_path, exist_ok=True)
        
    def load_and_prepare_data(self):
        """Load and prepare data for peak analysis"""
        print("📊 Loading data for peak analysis...")
        
        df = pd.read_csv(self.data_path)
        df['date'] = pd.to_datetime(df['date'])
        
        # Aggregate by date (sum all routes and train types)
        self.daily_totals = df.groupby('date').agg({
            'bookings': 'sum',
            'holiday_multiplier': 'first',
            'weekly_multiplier': 'first',
            'year': 'first',
            'month': 'first',
            'day_of_week': 'first'
        }).reset_index()
        
        print(f"✅ Data prepared: {len(self.daily_totals)} daily records from {self.daily_totals['date'].min()} to {self.daily_totals['date'].max()}")
        
    def find_yearly_peaks(self, top_n=5):
        """Find top N peak days for each year"""
        yearly_peaks = {}
        
        for year in range(2016, 2026):
            year_data = self.daily_totals[self.daily_totals['year'] == year]
            if len(year_data) > 0:
                top_days = year_data.nlargest(top_n, 'bookings')
                yearly_peaks[year] = top_days
        
        return yearly_peaks
    
    def plot_yearly_peak_evolution(self):
        """Create line graph showing evolution of peak days across years"""
        print("📈 Creating yearly peak evolution analysis...")
        
        yearly_peaks = self.find_yearly_peaks(top_n=1)  # Top 1 peak per year
        
        # Extract peak data
        peak_data = []
        for year, peaks in yearly_peaks.items():
            if len(peaks) > 0:
                peak = peaks.iloc[0]
                peak_data.append({
                    'year': year,
                    'date': peak['date'],
                    'bookings': peak['bookings'],
                    'holiday_multiplier': peak['holiday_multiplier'],
                    'month': peak['month'],
                    'day_of_week': peak['day_of_week']
                })
        
        peaks_df = pd.DataFrame(peak_data)
        
        # Create the main visualization
        fig, axes = plt.subplots(2, 2, figsize=(18, 14))
        fig.suptitle('Peak Day Evolution Analysis (2016-2025)', fontsize=20, fontweight='bold')
        
        # 1. Main line graph - Peak bookings over years
        ax1 = axes[0, 0]
        
        # Plot main trend line
        ax1.plot(peaks_df['year'], peaks_df['bookings'], 
                marker='o', linewidth=4, markersize=10, color='#E74C3C', alpha=0.8)
        
        # Highlight COVID impact years
        covid_mask = peaks_df['year'].isin([2020, 2021])
        covid_data = peaks_df[covid_mask]
        
        if len(covid_data) > 0:
            ax1.scatter(covid_data['year'], covid_data['bookings'], 
                       s=200, color='orange', edgecolor='red', linewidth=2, 
                       zorder=5, label='COVID Impact Years')
        
        # Highlight recovery years
        recovery_mask = peaks_df['year'].isin([2022, 2023, 2024, 2025])
        recovery_data = peaks_df[recovery_mask]
        
        if len(recovery_data) > 0:
            ax1.scatter(recovery_data['year'], recovery_data['bookings'], 
                       s=150, color='lightgreen', edgecolor='green', linewidth=2, 
                       zorder=4, label='Recovery Years')
        
        ax1.set_title('Yearly Peak Day Bookings Trend', fontsize=16, fontweight='bold')
        ax1.set_xlabel('Year', fontsize=14)
        ax1.set_ylabel('Peak Day Bookings', fontsize=14)
        ax1.grid(True, alpha=0.3)
        ax1.legend(fontsize=12)
        
        # Add trend line
        z = np.polyfit(peaks_df['year'], peaks_df['bookings'], 1)
        p = np.poly1d(z)
        ax1.plot(peaks_df['year'], p(peaks_df['year']), 
                "--", alpha=0.7, color='gray', linewidth=2, label='Trend Line')
        
        # Add annotations for significant points
        max_peak = peaks_df.loc[peaks_df['bookings'].idxmax()]
        min_peak = peaks_df.loc[peaks_df['bookings'].idxmin()]
        
        # Annotate highest peak
        ax1.annotate(f'Highest Peak\n{max_peak["year"]}: {int(max_peak["bookings"]):,}',
                    xy=(max_peak['year'], max_peak['bookings']),
                    xytext=(max_peak['year']-1, max_peak['bookings']+500),
                    arrowprops=dict(arrowstyle='->', color='red'),
                    bbox=dict(boxstyle="round,pad=0.3", facecolor='yellow', alpha=0.7),
                    fontsize=10, fontweight='bold')
        
        # Annotate lowest peak (likely COVID year)
        if min_peak['year'] in [2020, 2021]:
            ax1.annotate(f'COVID Impact\n{min_peak["year"]}: {int(min_peak["bookings"]):,}',
                        xy=(min_peak['year'], min_peak['bookings']),
                        xytext=(min_peak['year']+0.5, min_peak['bookings']-1000),
                        arrowprops=dict(arrowstyle='->', color='orange'),
                        bbox=dict(boxstyle="round,pad=0.3", facecolor='orange', alpha=0.7),
                        fontsize=10, fontweight='bold')
        
        # 2. Holiday multiplier correlation
        ax2 = axes[0, 1]
        
        # Scatter plot with color coding by year
        scatter = ax2.scatter(peaks_df['holiday_multiplier'], peaks_df['bookings'], 
                             c=peaks_df['year'], s=100, alpha=0.7, cmap='viridis')
        
        ax2.set_title('Peak Bookings vs Holiday Impact', fontsize=16, fontweight='bold')
        ax2.set_xlabel('Holiday Multiplier', fontsize=14)
        ax2.set_ylabel('Peak Day Bookings', fontsize=14)
        ax2.grid(True, alpha=0.3)
        
        # Add colorbar
        cbar = plt.colorbar(scatter, ax=ax2)
        cbar.set_label('Year', fontsize=12)
        
        # Add correlation coefficient
        correlation = peaks_df['holiday_multiplier'].corr(peaks_df['bookings'])
        ax2.text(0.05, 0.95, f'Correlation: {correlation:.3f}', 
                transform=ax2.transAxes, fontsize=12, fontweight='bold',
                bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.8))
        
        # 3. Monthly distribution of peak days
        ax3 = axes[1, 0]
        
        month_counts = peaks_df['month'].value_counts().sort_index()
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        bars = ax3.bar(range(1, 13), [month_counts.get(i, 0) for i in range(1, 13)],
                      color=plt.cm.Set3(np.linspace(0, 1, 12)), alpha=0.8)
        
        ax3.set_title('Peak Days Distribution by Month', fontsize=16, fontweight='bold')
        ax3.set_xlabel('Month', fontsize=14)
        ax3.set_ylabel('Number of Peak Days', fontsize=14)
        ax3.set_xticks(range(1, 13))
        ax3.set_xticklabels(month_names)
        ax3.grid(True, alpha=0.3, axis='y')
        
        # Add value labels on bars
        for i, bar in enumerate(bars):
            height = bar.get_height()
            if height > 0:
                ax3.text(bar.get_x() + bar.get_width()/2., height + 0.05,
                        f'{int(height)}', ha='center', va='bottom', fontweight='bold')
        
        # 4. Growth rate analysis
        ax4 = axes[1, 1]
        
        # Calculate year-over-year growth rates
        peaks_df['growth_rate'] = peaks_df['bookings'].pct_change() * 100
        growth_data = peaks_df[peaks_df['year'] > 2016].copy()
        
        # Create bar chart with color coding
        colors = []
        for rate in growth_data['growth_rate']:
            if rate > 10:
                colors.append('#27AE60')  # Strong growth - green
            elif rate > 0:
                colors.append('#3498DB')  # Positive growth - blue
            elif rate > -10:
                colors.append('#F39C12')  # Small decline - orange
            else:
                colors.append('#E74C3C')  # Significant decline - red
        
        bars = ax4.bar(growth_data['year'], growth_data['growth_rate'], 
                      color=colors, alpha=0.8)
        
        ax4.set_title('Year-over-Year Peak Day Growth Rate', fontsize=16, fontweight='bold')
        ax4.set_xlabel('Year', fontsize=14)
        ax4.set_ylabel('Growth Rate (%)', fontsize=14)
        ax4.axhline(y=0, color='black', linestyle='-', alpha=0.5)
        ax4.grid(True, alpha=0.3, axis='y')
        
        # Add value labels
        for bar, value in zip(bars, growth_data['growth_rate']):
            height = bar.get_height()
            y_pos = height + (2 if height > 0 else -4)
            ax4.text(bar.get_x() + bar.get_width()/2., y_pos,
                    f'{value:.1f}%', ha='center', 
                    va='bottom' if height > 0 else 'top',
                    fontweight='bold', fontsize=10)
        
        plt.tight_layout()
        
        # Save the plot
        output_file = os.path.join(self.output_path, 'peak_days_evolution.png')
        plt.savefig(output_file, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        
        print(f"✅ Peak days evolution saved to: {output_file}")
        
        return peaks_df
    
    def plot_top5_peaks_comparison(self):
        """Compare top 5 peak days across all years"""
        print("📈 Creating top 5 peaks comparison...")
        
        yearly_peaks = self.find_yearly_peaks(top_n=5)
        
        # Create figure
        fig, axes = plt.subplots(2, 5, figsize=(20, 10))
        fig.suptitle('Top 5 Peak Days by Year (2016-2025)', fontsize=20, fontweight='bold')
        
        years = list(range(2016, 2026))
        colors = plt.cm.tab10(np.linspace(0, 1, 10))
        
        for i, year in enumerate(years):
            row = i // 5
            col = i % 5
            ax = axes[row, col]
            
            if year in yearly_peaks and len(yearly_peaks[year]) > 0:
                peaks = yearly_peaks[year]
                
                # Create bar chart for top 5 days
                x_pos = range(len(peaks))
                bars = ax.bar(x_pos, peaks['bookings'], 
                             color=colors[i], alpha=0.7)
                
                ax.set_title(f'{year}', fontsize=14, fontweight='bold')
                ax.set_ylabel('Bookings', fontsize=12)
                ax.set_xlabel('Rank', fontsize=12)
                ax.set_xticks(x_pos)
                ax.set_xticklabels([f'#{j+1}' for j in x_pos])
                
                # Add value labels
                for bar, booking in zip(bars, peaks['bookings']):
                    height = bar.get_height()
                    ax.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                           f'{int(booking):,}', ha='center', va='bottom', 
                           fontsize=9, fontweight='bold', rotation=45)
                
                # Highlight if it's a holiday peak
                for j, (_, peak) in enumerate(peaks.iterrows()):
                    if peak['holiday_multiplier'] > 3:
                        bars[j].set_edgecolor('red')
                        bars[j].set_linewidth(2)
                
                ax.grid(True, alpha=0.3, axis='y')
            else:
                ax.text(0.5, 0.5, 'No Data', ha='center', va='center', 
                       transform=ax.transAxes, fontsize=12)
                ax.set_title(f'{year}', fontsize=14, fontweight='bold')
        
        plt.tight_layout()
        
        # Save the plot
        output_file = os.path.join(self.output_path, 'top5_peaks_comparison.png')
        plt.savefig(output_file, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        
        print(f"✅ Top 5 peaks comparison saved to: {output_file}")
    
    def create_peak_summary_table(self):
        """Create a detailed summary table of peak days"""
        print("📊 Creating peak days summary table...")
        
        yearly_peaks = self.find_yearly_peaks(top_n=3)
        
        # Prepare data for table
        summary_data = []
        for year, peaks in yearly_peaks.items():
            for rank, (_, peak) in enumerate(peaks.iterrows()):
                summary_data.append({
                    'Year': year,
                    'Rank': rank + 1,
                    'Date': peak['date'].strftime('%Y-%m-%d'),
                    'Day': peak['date'].strftime('%A'),
                    'Month': peak['date'].strftime('%B'),
                    'Bookings': int(peak['bookings']),
                    'Holiday_Multiplier': round(peak['holiday_multiplier'], 1),
                    'Type': 'Holiday' if peak['holiday_multiplier'] > 2 else 'Normal'
                })
        
        summary_df = pd.DataFrame(summary_data)
        
        # Save as CSV
        output_file = os.path.join(self.output_path, 'peak_days_summary.csv')
        summary_df.to_csv(output_file, index=False)
        
        print(f"✅ Peak days summary table saved to: {output_file}")
        
        # Print top peaks
        print("\n🏆 Top 10 Peak Days (All Years):")
        print("=" * 60)
        top_peaks = summary_df.nlargest(10, 'Bookings')
        
        for _, peak in top_peaks.iterrows():
            print(f"{peak['Date']} ({peak['Day'][:3]}): {peak['Bookings']:,} bookings - {peak['Type']} ({peak['Holiday_Multiplier']}x)")
        
        return summary_df

def main():
    """Main peak analysis pipeline"""
    print("🏔️  Peak Days Analysis - Yearly Trends")
    print("=" * 50)
    
    # Paths
    data_path = "/Users/macbookair/Documents/Code/hacksphrizz/data/train_booking_data_2016_2025.csv"
    output_path = "/Users/macbookair/Documents/Code/hacksphrizz/models/visualizations"
    
    # Initialize analyzer
    analyzer = PeakDaysAnalyzer(data_path, output_path)
    
    # Load data
    analyzer.load_and_prepare_data()
    
    # Create analyses
    print("\n1. Creating yearly peak evolution analysis...")
    peaks_df = analyzer.plot_yearly_peak_evolution()
    
    print("\n2. Creating top 5 peaks comparison...")
    analyzer.plot_top5_peaks_comparison()
    
    print("\n3. Creating peak summary table...")
    summary_df = analyzer.create_peak_summary_table()
    
    print(f"\n🎉 Peak analysis completed!")
    print(f"📁 Additional files saved in: {output_path}")
    print("\nNew files generated:")
    print("   • peak_days_evolution.png")
    print("   • top5_peaks_comparison.png")
    print("   • peak_days_summary.csv")

if __name__ == "__main__":
    main()