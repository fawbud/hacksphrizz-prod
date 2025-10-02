# Train Booking Dataset Documentation

## Overview
This dataset contains synthetic train booking data for Indonesian railways from 2016-2025, designed for AI demand prediction model training.

## File Information
- **Main Dataset**: `train_booking_data_2016_2025.csv`
- **Summary Statistics**: `data_summary.json`
- **Total Records**: 87,672 rows
- **Date Range**: January 1, 2016 - December 31, 2025

## Dataset Structure

### Columns Description

| Column | Type | Description |
|--------|------|-------------|
| `date` | Date | Booking date (YYYY-MM-DD format) |
| `route` | String | Train route (e.g., "Jakarta-Surabaya") |
| `train_type` | String | Class of service (Eksekutif, Bisnis, Ekonomi) |
| `bookings` | Integer | Number of bookings for this route/type/date |
| `holiday_multiplier` | Float | Impact factor for holidays (1.0 = normal, >1.0 = increased demand) |
| `weekly_multiplier` | Float | Day-of-week impact factor |
| `yearly_growth` | Float | Year-over-year growth factor |
| `covid_factor` | Float | COVID-19 impact factor (2020-2023) |
| `is_weekend` | Boolean | True if weekend day |
| `day_of_week` | Integer | Day of week (0=Sunday, 6=Saturday) |
| `month` | Integer | Month number (1-12) |
| `year` | Integer | Year (2016-2025) |

## Major Routes Included

1. **Jakarta-Surabaya** (Baseline: 2,800 daily bookings)
2. **Jakarta-Yogyakarta** (Baseline: 2,200 daily bookings)  
3. **Jakarta-Bandung** (Baseline: 3,500 daily bookings)
4. **Jakarta-Semarang** (Baseline: 1,800 daily bookings)
5. **Jakarta-Solo** (Baseline: 1,600 daily bookings)
6. **Surabaya-Malang** (Baseline: 1,200 daily bookings)
7. **Bandung-Yogyakarta** (Baseline: 900 daily bookings)
8. **Jakarta-Cirebon** (Baseline: 1,400 daily bookings)

## Train Types Distribution

- **Eksekutif**: 25% of total bookings
- **Bisnis**: 35% of total bookings  
- **Ekonomi**: 40% of total bookings

## Peak Patterns Implemented

### Major Holiday Peaks (Impact Multipliers)
- **Lebaran (Eid)**: 6.5-8.5x normal demand
- **Christmas**: 4.2-4.8x normal demand
- **New Year**: 4.8-5.2x normal demand
- **Long Weekends**: 1.8-2.7x normal demand

### Weekly Patterns
- **Friday**: 2.2x (evening departures)
- **Sunday**: 2.0x (return journeys)
- **Saturday**: 1.4x
- **Weekdays**: 1.0x (baseline)

### Yearly Trends
- **2016-2019**: Steady growth (8% YoY)
- **2020**: COVID impact (-60%)
- **2021**: Recovery phase (-35%)
- **2022**: Further recovery (-15%)
- **2023**: Near normal (-5%)
- **2024**: Full recovery
- **2025**: Growth (+5%)

## Data Quality Features

### Realism Factors
- **Random Variance**: ±10% on all bookings
- **Capacity Constraints**: Bookings capped at realistic train capacity
- **Route-Specific Patterns**: Each route has unique seasonal variations
- **COVID Impact**: Realistic pandemic effects on travel patterns

### AI Training Characteristics
- **Complexity**: Multiple overlapping seasonal patterns
- **Non-linearity**: Holiday impacts vary by year and route
- **External Shocks**: COVID disruption creates learning challenges
- **Feature Richness**: 12 predictive features per record

## Expected Model Performance
- **Target Accuracy**: 92-96%
- **Challenges**: Holiday prediction, COVID recovery patterns, multi-route interactions
- **Strong Signals**: Weekly patterns, major holidays, yearly trends

## Usage Recommendations

### For Training
1. Split data chronologically (80% train, 20% test)
2. Use time-series cross-validation
3. Feature engineer: lag features, rolling averages
4. Consider ensemble methods for different route types

### Feature Engineering Suggestions
- Rolling averages (7-day, 30-day)
- Lag features (previous week/month/year)
- Holiday proximity features
- Route interaction terms
- Seasonal decomposition

## Data Generation Methodology

This synthetic dataset was created using:
- Historical research on Indonesian travel patterns
- Real holiday calendars (2016-2025)
- Empirical multipliers based on industry knowledge
- Controlled randomization to prevent overfitting
- Realistic capacity constraints

**Note**: This is synthetic data created for AI model development and should not be used for actual business decisions.