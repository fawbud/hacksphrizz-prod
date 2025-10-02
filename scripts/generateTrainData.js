const fs = require('fs');
const path = require('path');
const https = require('https');

// Major routes dengan baseline daily bookings yang lebih realistis dan bervariasi
const MAJOR_ROUTES = {
  'Jakarta-Surabaya': { baseline: 2800, capacity: 12000, peakMultiplier: 4.5 },
  'Jakarta-Yogyakarta': { baseline: 2200, capacity: 9500, peakMultiplier: 5.2 },
  'Jakarta-Bandung': { baseline: 3500, capacity: 15000, peakMultiplier: 3.8 },
  'Jakarta-Semarang': { baseline: 1800, capacity: 7500, peakMultiplier: 4.0 },
  'Jakarta-Solo': { baseline: 1600, capacity: 6800, peakMultiplier: 4.2 },
  'Surabaya-Malang': { baseline: 1200, capacity: 5200, peakMultiplier: 3.5 },
  'Bandung-Yogyakarta': { baseline: 900, capacity: 4000, peakMultiplier: 3.2 },
  'Jakarta-Cirebon': { baseline: 1400, capacity: 6000, peakMultiplier: 3.8 }
};

// Train types distribution
const TRAIN_TYPES = {
  'Eksekutif': 0.25,
  'Bisnis': 0.35, 
  'Ekonomi': 0.40
};

// Holiday definitions dengan impact multiplier yang lebih bervariasi
const HOLIDAYS = {
  2016: {
    'lebaran': { start: '2016-07-04', end: '2016-07-08', impact: [6.5, 7.2, 8.1, 7.8, 6.9] },
    'christmas': { start: '2016-12-22', end: '2016-12-26', impact: [3.8, 4.2, 4.6, 4.1, 3.5] },
    'newyear': { start: '2016-12-29', end: '2017-01-02', impact: [4.2, 4.8, 5.1, 4.9, 4.3] },
    'longWeekends': [
      { date: '2016-03-11', impact: 2.2 }, // Nyepi
      { date: '2016-05-05', impact: 1.8 }, // Ascension
      { date: '2016-08-17', impact: 2.5 }, // Independence
    ]
  },
  2017: {
    'lebaran': { start: '2017-06-23', end: '2017-06-27', impact: [7.0, 7.8, 8.5, 8.2, 7.3] },
    'christmas': { start: '2017-12-22', end: '2017-12-26', impact: [4.0, 4.5, 4.8, 4.3, 3.7] },
    'newyear': { start: '2017-12-29', end: '2018-01-02', impact: [4.5, 5.1, 5.4, 5.0, 4.6] },
    'longWeekends': [
      { date: '2017-03-28', impact: 2.1 },
      { date: '2017-05-25', impact: 1.9 },
      { date: '2017-08-17', impact: 2.6 },
    ]
  },
  2018: {
    'lebaran': { start: '2018-06-12', end: '2018-06-16', impact: [7.3, 8.1, 8.8, 8.4, 7.6] },
    'christmas': { start: '2018-12-22', end: '2018-12-26', impact: [3.9, 4.3, 4.7, 4.2, 3.8] },
    'newyear': { start: '2018-12-29', end: '2019-01-02', impact: [4.3, 4.9, 5.2, 4.8, 4.4] },
    'longWeekends': [
      { date: '2018-03-17', impact: 2.3 },
      { date: '2018-05-10', impact: 1.7 },
      { date: '2018-08-17', impact: 2.4 },
    ]
  },
  2019: {
    'lebaran': { start: '2019-06-02', end: '2019-06-06', impact: [7.6, 8.4, 9.1, 8.7, 7.9] },
    'christmas': { start: '2019-12-22', end: '2019-12-26', impact: [4.1, 4.6, 4.9, 4.4, 4.0] },
    'newyear': { start: '2019-12-29', end: '2020-01-02', impact: [4.6, 5.2, 5.5, 5.1, 4.7] },
    'longWeekends': [
      { date: '2019-03-07', impact: 2.0 },
      { date: '2019-05-30', impact: 2.1 },
      { date: '2019-08-17', impact: 2.7 },
    ]
  },
  2020: {
    'lebaran': { start: '2020-05-22', end: '2020-05-26', impact: [1.8, 2.1, 2.4, 2.2, 1.9] }, // COVID impact
    'christmas': { start: '2020-12-22', end: '2020-12-26', impact: [1.5, 1.8, 2.0, 1.7, 1.6] },
    'newyear': { start: '2020-12-29', end: '2021-01-02', impact: [1.9, 2.2, 2.5, 2.3, 2.0] },
    'covidFactor': 0.4 // 60% reduction
  },
  2021: {
    'lebaran': { start: '2021-05-11', end: '2021-05-15', impact: [2.8, 3.2, 3.6, 3.4, 3.0] }, // Recovery phase
    'christmas': { start: '2021-12-22', end: '2021-12-26', impact: [2.4, 2.8, 3.1, 2.9, 2.5] },
    'newyear': { start: '2021-12-29', end: '2022-01-02', impact: [2.7, 3.1, 3.4, 3.2, 2.8] },
    'covidFactor': 0.65 // Gradual recovery
  },
  2022: {
    'lebaran': { start: '2022-04-30', end: '2022-05-04', impact: [5.2, 5.8, 6.4, 6.1, 5.5] }, // Recovery
    'christmas': { start: '2022-12-22', end: '2022-12-26', impact: [3.5, 3.9, 4.2, 3.8, 3.6] },
    'newyear': { start: '2022-12-29', end: '2023-01-02', impact: [3.8, 4.3, 4.6, 4.4, 4.0] },
    'covidFactor': 0.85
  },
  2023: {
    'lebaran': { start: '2023-04-19', end: '2023-04-23', impact: [6.8, 7.5, 8.2, 7.9, 7.1] },
    'christmas': { start: '2023-12-22', end: '2023-12-26', impact: [3.9, 4.4, 4.7, 4.3, 4.0] },
    'newyear': { start: '2023-12-29', end: '2024-01-02', impact: [4.2, 4.8, 5.1, 4.9, 4.5] },
    'covidFactor': 0.95
  },
  2024: {
    'lebaran': { start: '2024-04-08', end: '2024-04-12', impact: [7.5, 8.3, 9.0, 8.6, 7.8] },
    'christmas': { start: '2024-12-22', end: '2024-12-26', impact: [4.2, 4.7, 5.0, 4.6, 4.3] },
    'newyear': { start: '2024-12-29', end: '2025-01-02', impact: [4.5, 5.0, 5.3, 5.1, 4.7] },
    'covidFactor': 1.0
  },
  2025: {
    'lebaran': { start: '2025-03-29', end: '2025-04-02', impact: [7.8, 8.5, 9.2, 8.8, 8.0] },
    'christmas': { start: '2025-12-22', end: '2025-12-26', impact: [4.3, 4.8, 5.1, 4.7, 4.4] },
    'newyear': { start: '2025-12-29', end: '2026-01-02', impact: [4.6, 5.1, 5.4, 5.2, 4.8] },
    'covidFactor': 1.05 // Slight growth
  }
};

// Utility functions
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

function isFriday(date) {
  return date.getDay() === 5;
}

function isSunday(date) {
  return date.getDay() === 0;
}

function getDateString(date) {
  return date.toISOString().split('T')[0];
}

function isInRange(date, startStr, endStr) {
  const dateStr = getDateString(date);
  return dateStr >= startStr && dateStr <= endStr;
}

function getHolidayMultiplier(date, year) {
  const holidays = HOLIDAYS[year];
  if (!holidays) return 1;
  
  const dateStr = getDateString(date);
  
  // Check major holidays with daily variation
  if (holidays.lebaran && isInRange(date, holidays.lebaran.start, holidays.lebaran.end)) {
    const dayIndex = getDayIndexInRange(date, holidays.lebaran.start, holidays.lebaran.end);
    return holidays.lebaran.impact[dayIndex] || holidays.lebaran.impact[0];
  }
  if (holidays.christmas && isInRange(date, holidays.christmas.start, holidays.christmas.end)) {
    const dayIndex = getDayIndexInRange(date, holidays.christmas.start, holidays.christmas.end);
    return holidays.christmas.impact[dayIndex] || holidays.christmas.impact[0];
  }
  if (holidays.newyear && isInRange(date, holidays.newyear.start, holidays.newyear.end)) {
    const dayIndex = getDayIndexInRange(date, holidays.newyear.start, holidays.newyear.end);
    return holidays.newyear.impact[dayIndex] || holidays.newyear.impact[0];
  }
  
  // Check long weekends
  if (holidays.longWeekends) {
    for (const longWeekend of holidays.longWeekends) {
      if (dateStr === longWeekend.date) {
        return longWeekend.impact;
      }
    }
  }
  
  return 1;
}

function getDayIndexInRange(date, startStr, endStr) {
  const startDate = new Date(startStr);
  const diffTime = date.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.min(4, diffDays)); // Ensure index is within 0-4 range
}

function getWeeklyMultiplier(date) {
  if (isFriday(date)) return 2.2; // Friday evening departures
  if (isSunday(date)) return 2.0;  // Sunday evening returns
  if (isWeekend(date)) return 1.4;  // Saturday
  return 1; // Weekdays
}

function getYearlyGrowth(year) {
  const baseYear = 2016;
  const growthRates = {
    2016: 1.0,
    2017: 1.08,
    2018: 1.16,
    2019: 1.25,
    2020: 0.5,  // COVID
    2021: 0.65, // Recovery
    2022: 0.85, // Further recovery
    2023: 0.95, // Near normal
    2024: 1.0,  // Normal
    2025: 1.05  // Growth
  };
  return growthRates[year] || 1;
}

function addRandomVariance(value, variance = 0.1) {
  const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;
  return Math.round(value * randomFactor);
}

function generateBookingData() {
  const data = [];
  const startDate = new Date('2016-01-01');
  const endDate = new Date('2025-12-31');
  
  console.log('Generating booking data from 2016-2025...');
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const year = date.getFullYear();
    const dateStr = getDateString(date);
    
    // Get multipliers
    const holidayMultiplier = getHolidayMultiplier(date, year);
    const weeklyMultiplier = getWeeklyMultiplier(date);
    const yearlyGrowth = getYearlyGrowth(year);
    const covidFactor = HOLIDAYS[year]?.covidFactor || 1;
    
    // Generate data for each route
    for (const [routeName, routeData] of Object.entries(MAJOR_ROUTES)) {
      const baseBookings = routeData.baseline;
      
      // Calculate total bookings with more variance
      let totalBookings = baseBookings * holidayMultiplier * weeklyMultiplier * yearlyGrowth * covidFactor;
      
      // Add route-specific variance for realism
      const routeVariance = Math.sin(date.getTime() / (1000 * 60 * 60 * 24 * 7)) * 0.05; // Weekly sine wave
      totalBookings *= (1 + routeVariance);
      
      // More aggressive random variance (20-30%)
      totalBookings = addRandomVariance(totalBookings, 0.2 + Math.random() * 0.1);
      
      // Peak day logic with higher variability
      const peakChance = Math.random();
      if (peakChance < 0.015) { // 1.5% chance of extreme peak
        totalBookings *= routeData.peakMultiplier * (2.5 + Math.random() * 1.5);
      } else if (peakChance < 0.04) { // 2.5% chance of high peak
        totalBookings *= routeData.peakMultiplier * (1.8 + Math.random() * 0.7);
      } else if (peakChance < 0.1) { // 6% chance of medium peak
        totalBookings *= routeData.peakMultiplier * (1.3 + Math.random() * 0.5);
      }
      
      // Capacity with buffer variance (80-95% utilization max)
      const capacityBuffer = 0.8 + Math.random() * 0.15;
      totalBookings = Math.min(totalBookings, Math.round(routeData.capacity * capacityBuffer));
      
      // Ensure minimum bookings
      totalBookings = Math.max(80, totalBookings);
      
      // Distribute across train types
      for (const [trainType, percentage] of Object.entries(TRAIN_TYPES)) {
        const typeBookings = Math.round(totalBookings * percentage);
        
        data.push({
          date: dateStr,
          route: routeName,
          train_type: trainType,
          bookings: typeBookings,
          holiday_multiplier: Math.round(holidayMultiplier * 100) / 100,
          weekly_multiplier: Math.round(weeklyMultiplier * 100) / 100,
          yearly_growth: Math.round(yearlyGrowth * 100) / 100,
          covid_factor: Math.round(covidFactor * 100) / 100,
          is_weekend: isWeekend(date),
          day_of_week: date.getDay(),
          month: date.getMonth() + 1,
          year: year
        });
      }
    }
  }
  
  return data;
}

function saveToCSV(data) {
  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const headers = [
    'date', 'route', 'train_type', 'bookings', 
    'holiday_multiplier', 'weekly_multiplier', 'yearly_growth', 'covid_factor',
    'is_weekend', 'day_of_week', 'month', 'year'
  ];
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header]).join(','))
  ].join('\n');
  
  const filePath = path.join(dataDir, 'train_booking_data_2016_2025.csv');
  fs.writeFileSync(filePath, csvContent);
  console.log(`Generated ${data.length} records and saved to ${filePath}`);
  
  // Generate summary statistics
  const summary = {
    totalRecords: data.length,
    dateRange: `${data[0].date} to ${data[data.length - 1].date}`,
    routes: [...new Set(data.map(d => d.route))],
    trainTypes: [...new Set(data.map(d => d.train_type))],
    avgDailyBookingsPerRoute: Math.round(data.reduce((sum, d) => sum + d.bookings, 0) / data.length),
    maxBookings: Math.max(...data.map(d => d.bookings)),
    minBookings: Math.min(...data.map(d => d.bookings))
  };
  
  console.log('\nSummary Statistics:');
  console.log(JSON.stringify(summary, null, 2));
  
  // Save summary to JSON file
  const summaryPath = path.join(dataDir, 'data_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`Summary saved to ${summaryPath}`);
}

// Generate and save data
console.log('Starting train booking data generation...');
const bookingData = generateBookingData();
saveToCSV(bookingData);
console.log('Data generation completed successfully!');