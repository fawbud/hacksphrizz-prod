'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

// Helper function to calculate approximate Eid al-Adha dates
// Idul Adha is ~70 days after Eid al-Fitr (2 months and 10 days in Islamic calendar)
const getIdulAdhaDate = (year) => {
  const lebaran = getLebaranDates(year);
  const idulAdha = new Date(lebaran.main);
  idulAdha.setDate(idulAdha.getDate() + 70); // Approximately 70 days after Lebaran
  
  const startDate = new Date(idulAdha);
  startDate.setDate(startDate.getDate() - 3); // 3 days before
  
  const endDate = new Date(idulAdha);
  endDate.setDate(endDate.getDate() + 3); // 3 days after
  
  return {
    main: idulAdha,
    start: startDate,
    end: endDate
  };
};

// Helper function to calculate approximate Eid al-Fitr dates
// Lebaran moves ~10-11 days earlier each year in Gregorian calendar
const getLebaranDates = (year) => {
  // Base reference: Lebaran 2024 was around April 10-11
  const lebaranBase2024 = new Date(2024, 3, 10); // April 10, 2024
  
  // Calculate days difference from 2024
  const yearDiff = year - 2024;
  
  // Lebaran moves back approximately 10.875 days per year
  // (Islamic year is ~354.37 days vs Gregorian 365.25 days = difference of ~10.88 days)
  const daysShift = Math.round(yearDiff * 10.875);
  
  // Calculate approximate Lebaran date for the given year
  const lebaranDate = new Date(lebaranBase2024);
  lebaranDate.setDate(lebaranDate.getDate() - daysShift);
  
  // Adjust for year overflow/underflow
  lebaranDate.setFullYear(year);
  
  // Return start and end of Lebaran period (typically 7-10 days around the main dates)
  const startDate = new Date(lebaranDate);
  startDate.setDate(startDate.getDate() - 5); // 5 days before
  
  const endDate = new Date(lebaranDate);
  endDate.setDate(endDate.getDate() + 5); // 5 days after
  
  return {
    main: lebaranDate,
    start: startDate,
    end: endDate,
    month: lebaranDate.getMonth() + 1,
    day: lebaranDate.getDate()
  };
};

// Helper function to detect holidays and special periods
const getHolidayMultiplier = (date) => {
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();
  const year = date.getFullYear();
  
  // Christmas and New Year period (Dec 20 - Jan 10)
  if ((month === 12 && day >= 20) || (month === 1 && day <= 10)) {
    return 2.8; // Very high demand during Christmas/New Year
  }
  
  // Dynamic Lebaran/Eid al-Fitr calculation
  const lebaran = getLebaranDates(year);
  const currentDate = new Date(year, month - 1, day);
  
  // Check if current date falls within Lebaran period
  if (currentDate >= lebaran.start && currentDate <= lebaran.end) {
    return 2.5; // High demand for Lebaran travel
  }
  
  // Dynamic Idul Adha calculation
  const idulAdha = getIdulAdhaDate(year);
  if (currentDate >= idulAdha.start && currentDate <= idulAdha.end) {
    return 2.0; // High demand for Idul Adha travel
  }
  
  // Chinese New Year period (late January/early February)
  if ((month === 1 && day >= 25) || (month === 2 && day <= 10)) {
    return 1.8;
  }
  
  // Independence Day Indonesia (August 17) - long weekend effect
  if (month === 8 && day >= 15 && day <= 19) {
    return 1.6;
  }
  
  // Labor Day (May 1) - long weekend effect
  if (month === 5 && day >= 1 && day <= 3) {
    return 1.4;
  }
  
  // Christmas preparation period (Dec 10-19)
  if (month === 12 && day >= 10 && day <= 19) {
    return 1.5;
  }
  
  // School holiday periods (June-July)
  if (month === 6 || month === 7) {
    return 1.3;
  }
  
  // Regular weekend boost
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  if (isWeekend) {
    return 1.3;
  }
  
  return 1.0; // Normal days
};

// Helper function to get seasonal adjustment
const getSeasonalMultiplier = (date) => {
  const month = date.getMonth() + 1;
  
  // Peak travel seasons
  if (month === 12 || month === 1) return 1.4; // Christmas/New Year season
  if (month === 6 || month === 7) return 1.2; // School holiday season
  if (month === 3 || month === 4) return 1.3; // Lebaran season
  if (month === 11) return 1.1; // Pre-holiday season
  
  // Lower travel seasons
  if (month === 2 || month === 8 || month === 9) return 0.9; // Post-holiday dips
  
  return 1.0; // Normal months
};

// Generate yearly historical data with Islamic calendar awareness
const generateYearlyHistoricalData = (year) => {
  const yearlyData = [];
  const startDate = new Date(year, 0, 1); // January 1st of the year
  const endDate = new Date(year, 11, 31); // December 31st of the year
  
  // Get Lebaran and Idul Adha dates for the year
  const lebaran = getLebaranDates(year);
  const idulAdha = getIdulAdhaDate(year);
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const currentDate = new Date(date);
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    
    // Check for holidays
    let holidayMultiplier = 1.0;
    let holidayType = 'regular';
    
    // Christmas/New Year period
    if ((currentDate.getMonth() === 11 && currentDate.getDate() >= 24) || 
        (currentDate.getMonth() === 0 && currentDate.getDate() <= 2)) {
      holidayMultiplier = 2.8;
      holidayType = 'christmas';
    }
    
    // Lebaran period (7 days around main date)
    const daysDiffLebaran = Math.abs((currentDate - lebaran.main) / (1000 * 60 * 60 * 24));
    if (daysDiffLebaran <= 3) {
      holidayMultiplier = 3.2;
      holidayType = 'lebaran';
    } else if (daysDiffLebaran <= 7) {
      holidayMultiplier = 2.1;
      holidayType = 'lebaran_period';
    }
    
    // Idul Adha period (5 days around main date)
    const daysDiffIdulAdha = Math.abs((currentDate - idulAdha.main) / (1000 * 60 * 60 * 24));
    if (daysDiffIdulAdha <= 2) {
      holidayMultiplier = 2.5;
      holidayType = 'idul_adha';
    } else if (daysDiffIdulAdha <= 5) {
      holidayMultiplier = 1.8;
      holidayType = 'idul_adha_period';
    }
    
    // Weekend multiplier
    if (isWeekend && holidayMultiplier <= 1.2) {
      holidayMultiplier *= 1.4;
    }
    
    // Base bookings with seasonal variations
    let baseBookings = 2200;
    
    // Seasonal adjustments
    const month = currentDate.getMonth();
    if (month >= 5 && month <= 7) { // June-August (school holidays)
      baseBookings *= 1.3;
    } else if (month === 11 || month === 0) { // December-January (year end holidays)
      baseBookings *= 1.2;
    }
    
    // Apply holiday multiplier
    const actualBookings = Math.round(baseBookings * holidayMultiplier * (0.9 + Math.random() * 0.2));
    
    yearlyData.push({
      date: currentDate.toISOString().split('T')[0],
      actual_bookings: actualBookings,
      is_weekend: isWeekend,
      holiday_multiplier: holidayMultiplier,
      holiday_type: holidayType,
      month: currentDate.getMonth() + 1,
      week_of_year: Math.ceil(((currentDate - startDate) / (1000 * 60 * 60 * 24)) / 7)
    });
  }
  
  return {
    year: year,
    total_days: yearlyData.length,
    daily_data: yearlyData,
    lebaran_date: lebaran.main.toISOString().split('T')[0],
    idul_adha_date: idulAdha.main.toISOString().split('T')[0],
    summary: {
      total_bookings: yearlyData.reduce((sum, day) => sum + day.actual_bookings, 0),
      avg_daily: Math.round(yearlyData.reduce((sum, day) => sum + day.actual_bookings, 0) / yearlyData.length),
      peak_day: yearlyData.reduce((max, day) => day.actual_bookings > max.actual_bookings ? day : max),
      weekend_days: yearlyData.filter(day => day.is_weekend).length,
      holiday_days: yearlyData.filter(day => day.holiday_multiplier > 1.5).length
    }
  };
};

// Generate static mock data for the dashboard
const generateMockData = (predictionDays = 30) => {
  const predictions = [];
  const historicalData = [];
  
  // Generate historical data (last 30 days before current date)
  const currentDate = new Date('2025-10-03');
  for (let i = 30; i > 0; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    
    const baseBookings = 2400; // Base for historical
    const holidayMultiplier = getHolidayMultiplier(date);
    const seasonalMultiplier = getSeasonalMultiplier(date);
    const randomVariation = 0.85 + Math.random() * 0.3;
    
    const actualBookings = Math.round(baseBookings * holidayMultiplier * seasonalMultiplier * randomVariation);
    
    historicalData.push({
      date: date.toISOString().split('T')[0],
      actual_bookings: actualBookings,
      day_of_week: date.toLocaleDateString('en-US', { weekday: 'long' }),
      is_weekend: date.getDay() === 0 || date.getDay() === 6,
      holiday_multiplier: holidayMultiplier
    });
  }
  
  // Generate future predictions starting from current date
  const startDate = new Date('2025-10-03');
  for (let i = 0; i < predictionDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const baseBookings = 2500;
    const holidayMultiplier = getHolidayMultiplier(date);
    const seasonalMultiplier = getSeasonalMultiplier(date);
    const randomVariation = 0.85 + Math.random() * 0.3;
    
    const predictedBookings = Math.round(baseBookings * holidayMultiplier * seasonalMultiplier * randomVariation);
    
    predictions.push({
      date: date.toISOString().split('T')[0],
      predicted_bookings: predictedBookings,
      day_of_week: date.toLocaleDateString('en-US', { weekday: 'long' }),
      is_weekend: date.getDay() === 0 || date.getDay() === 6,
      holiday_multiplier: holidayMultiplier,
      seasonal_multiplier: seasonalMultiplier
    });
  }
  
  // Generate route breakdown
  const routes = ['Jakarta-Yogyakarta', 'Jakarta-Bandung', 'Jakarta-Surabaya', 'Bandung-Surabaya', 'Yogyakarta-Surabaya'];
  const trainTypes = ['Eksekutif', 'Bisnis', 'Ekonomi'];
  const routeBreakdown = [];
  
  routes.forEach(route => {
    trainTypes.forEach(trainType => {
      const baseBookings = 150;
      const routeMultiplier = route.includes('Jakarta') ? 1.2 : 0.8;
      const typeMultiplier = trainType === 'Ekonomi' ? 1.4 : trainType === 'Bisnis' ? 1.0 : 0.6;
      
      const bookings = Math.round(baseBookings * routeMultiplier * typeMultiplier);
      
      routeBreakdown.push({
        route,
        train_type: trainType,
        predicted_bookings: bookings
      });
    });
  });
  
  // Calculate summary
  const totalPredicted = predictions.reduce((sum, p) => sum + p.predicted_bookings, 0);
  const avgDaily = Math.round(totalPredicted / predictions.length);
  const peakDay = predictions.reduce((max, p) => p.predicted_bookings > max.predicted_bookings ? p : max);
  
  // Get dynamic holiday dates for display
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const lebaran2025 = getLebaranDates(2025);
  const lebaran2026 = getLebaranDates(2026);
  const idulAdha2025 = getIdulAdhaDate(2025);
  const idulAdha2026 = getIdulAdhaDate(2026);
  
  return {
    success: true,
    model_type: 'enhanced_gradient_boosting_with_islamic_calendar',
    prediction_period: `${predictions[0].date} to ${predictions[predictions.length - 1].date}`,
    historical_data: {
      total_records: 87672,
      date_range: '2016-01-01 to 2025-12-31',
      total_bookings: 15234567,
      avg_daily_bookings: 2450,
      recent_actual: historicalData
    },
    holiday_calendar: {
      lebaran_2025: lebaran2025.main.toISOString().split('T')[0],
      lebaran_2026: lebaran2026.main.toISOString().split('T')[0],
      idul_adha_2025: idulAdha2025.main.toISOString().split('T')[0],
      idul_adha_2026: idulAdha2026.main.toISOString().split('T')[0]
    },
    predictions: {
      daily_totals: predictions,
      route_breakdown: routeBreakdown,
      summary: {
        total_predicted_bookings: totalPredicted,
        avg_daily_predicted: avgDaily,
        peak_day: peakDay,
        routes_covered: routes.length
      }
    },
    timestamp: new Date().toISOString()
  };
};

// Generate demand vs capacity matrix
const generateDemandMatrix = () => {
  const routes = ['Jakarta-Yogyakarta', 'Jakarta-Bandung', 'Jakarta-Surabaya', 'Jakarta-Semarang'];
  const data = [];
  
  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    routes.forEach(route => {
      const baseDemand = 800 + Math.random() * 400;
      const capacity = 1000;
      const utilizationPct = Math.round((baseDemand / capacity) * 100);
      
      let priority = 'normal';
      if (utilizationPct > 95) priority = 'critical';
      else if (utilizationPct > 85) priority = 'warning';
      
      data.push({
        date: date.toLocaleDateString('id-ID'),
        route,
        predicted: Math.round(baseDemand),
        capacity,
        utilizationPct,
        priority,
        queueNeeded: utilizationPct > 85
      });
    });
  }
  
  return data;
};

// Historical report data for 10-year trends
const generateHistoricalReportData = () => {
  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  return years.map(year => {
    const yearlyDataObj = generateYearlyHistoricalData(year);
    const yearlyData = yearlyDataObj.daily_data;
    const totalBookings = yearlyData.reduce((sum, day) => sum + day.actual_bookings, 0);
    const lebaranPeak = Math.max(...yearlyData.filter(day => day.holiday_type === 'lebaran' || day.holiday_type === 'lebaran_period').map(day => day.actual_bookings));
    
    return {
      year,
      bookings: totalBookings,
      lebaranPeak,
      avgDaily: Math.round(totalBookings / 365),
      holiday_days: yearlyData.filter(day => day.holiday_multiplier > 1.5).length
    };
  });
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('predict');
  
  // Predict tab states (exact copy from simulation)
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [predictionDays, setPredictionDays] = useState(30);
  const [historicalYear, setHistoricalYear] = useState(2024);
  const [yearlyHistoricalData, setYearlyHistoricalData] = useState(null);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  
  // Real-time operations mock data
  const [liveStats, setLiveStats] = useState({
    activeQueue: 847,
    activeTransactions: 234,
    blockedBots: 156,
    serverLoad: 73
  });

  // Historical data for reports
  const historicalReportData = generateHistoricalReportData();

  // AI Insights state
  const [aiInsights, setAiInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(null);

  // Fetch AI Insights
  useEffect(() => {
    const fetchInsights = async () => {
      setInsightsLoading(true);
      setInsightsError(null);
      try {
        const response = await fetch('/api/insights/generate?timeRange=24h');
        const data = await response.json();
        if (data.success) {
          setAiInsights(data.insights);
        } else {
          setInsightsError(data.error || 'Failed to fetch insights');
        }
      } catch (error) {
        console.error('Error fetching AI insights:', error);
        setInsightsError(error.message);
      } finally {
        setInsightsLoading(false);
      }
    };

    // Fetch immediately
    fetchInsights();

    // Refresh every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        activeQueue: prev.activeQueue + Math.floor(Math.random() * 20 - 10),
        activeTransactions: prev.activeTransactions + Math.floor(Math.random() * 10 - 5),
        blockedBots: prev.blockedBots + Math.floor(Math.random() * 5),
        serverLoad: Math.max(60, Math.min(90, prev.serverLoad + Math.floor(Math.random() * 6 - 3)))
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Generate predictions with mock data
  const generatePredictions = () => {
    setLoading(true);
    setTimeout(() => {
      const data = generateMockData(predictionDays);
      setPredictions(data);
      setLastFetch(new Date().toLocaleTimeString());
      setLoading(false);
    }, 500); // Simulate loading delay
  };

  // Generate historical data for selected year
  const generateHistoricalData = (year) => {
    setHistoricalLoading(true);
    setTimeout(() => {
      const data = generateYearlyHistoricalData(year);
      setYearlyHistoricalData(data);
      setHistoricalLoading(false);
    }, 300);
  };

  // Auto-generate on component mount and when prediction days change
  useEffect(() => {
    generatePredictions();
  }, [predictionDays]);

  // Auto-generate historical data when year changes
  useEffect(() => {
    generateHistoricalData(historicalYear);
  }, [historicalYear]);

  const renderPredictTab = () => {
    // Colors for charts
    const colors = ['#F27500', '#d96600', '#ffb366', '#e65c00', '#ff8533'];

    // Prepare data for charts - show all available data based on predictionDays
    const dailyChartData = predictions?.predictions?.daily_totals || [];
    const weeklyChartData = dailyChartData.reduce((acc, day) => {
      const weekStart = new Date(day.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!acc[weekKey]) {
        acc[weekKey] = { week: weekKey, bookings: 0, days: 0 };
      }
      acc[weekKey].bookings += day.predicted_bookings;
      acc[weekKey].days += 1;
      return acc;
    }, {});

    const weeklyData = Object.values(weeklyChartData).map(week => ({
      week: week.week,
      avg_daily_bookings: Math.round(week.bookings / week.days)
    }));

    // Route breakdown data for pie chart
    const routeData = predictions?.predictions?.route_breakdown?.reduce((acc, item) => {
      if (!acc[item.route]) {
        acc[item.route] = 0;
      }
      acc[item.route] += item.predicted_bookings;
      return acc;
    }, {});

    const pieData = routeData ? Object.entries(routeData).map(([route, bookings]) => ({
      name: route.replace('Jakarta-', ''),
      value: bookings
    })) : [];

    // Combined historical and predicted data for trend analysis
    const historicalData = predictions?.historical_data?.recent_actual || [];
    const historicalAvg = historicalData.length > 0 
      ? Math.round(historicalData.reduce((sum, day) => sum + day.actual_bookings, 0) / historicalData.length)
      : 0;
    
    const combinedTrendData = [
      ...historicalData.map(day => ({
        date: day.date,
        actual_bookings: day.actual_bookings,
        predicted_bookings: null,
        type: 'historical'
      })),
      ...dailyChartData.slice(0, predictionDays).map(day => ({
        date: day.date,
        actual_bookings: null,
        predicted_bookings: day.predicted_bookings,
        type: 'predicted'
      }))
    ];

    // Train type breakdown
    const trainTypeData = predictions?.predictions?.route_breakdown?.reduce((acc, item) => {
      if (!acc[item.train_type]) {
        acc[item.train_type] = 0;
      }
      acc[item.train_type] += item.predicted_bookings;
      return acc;
    }, {});

    const trainTypeChartData = trainTypeData ? Object.entries(trainTypeData).map(([type, bookings]) => ({
      train_type: type,
      bookings
    })) : [];

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Train Booking Demand Dashboard
                </h1>
                <p className="text-gray-600">
                  AI-powered demand prediction and analytics
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Prediction Days:
                  </label>
                  <select
                    value={predictionDays}
                    onChange={(e) => setPredictionDays(Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#F27500] focus:border-[#F27500] min-w-[140px] appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundSize: '16px',
                      backgroundPosition: 'right 8px center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={180}>6 Months (180 Days)</option>
                    <option value={365}>1 Year (365 Days)</option>
                  </select>
                </div>
                <button
                  onClick={generatePredictions}
                  disabled={loading}
                  className="bg-[#F27500] hover:bg-[#d96600] disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {loading ? 'Generating...' : 'Refresh Data'}
                </button>
              </div>
            </div>
            {lastFetch && (
              <p className="text-sm text-gray-500 mt-2">
                Last updated: {lastFetch}
              </p>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-sm p-12 mb-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F27500] mx-auto mb-4"></div>
                <p className="text-gray-600">Generating predictions...</p>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          {predictions && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <svg className="w-6 h-6 text-[#F27500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">ML Model Type</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {predictions.model_type?.includes('enhanced') ? 'Enhanced ML' : 'Statistical'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {predictions.model_type?.includes('islamic') ? 'Islamic Calendar Aware' : 'Standard Model'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Model Performance</p>
                      <p className="text-2xl font-semibold text-green-900">
                        81.26% Accuracy
                      </p>
                      <p className="text-xs text-gray-500">
                        R² Score • 58 ML Features • 87K Records
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg Daily Predicted</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {predictions.predictions?.summary?.avg_daily_predicted?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Historical vs Predicted</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-lg font-semibold text-green-600">
                          {historicalAvg.toLocaleString()}
                        </p>
                        <span className="text-gray-400">vs</span>
                        <p className="text-lg font-semibold text-[#F27500]">
                          {predictions.predictions?.summary?.avg_daily_predicted?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Historical avg / Predicted avg</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Daily Predictions Chart */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Daily Booking Predictions (Next {predictionDays} Days)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyChartData.slice(0, predictionDays)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value, name) => [value.toLocaleString(), 'Predicted Bookings']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="predicted_bookings" 
                        stroke="#F27500" 
                        fill="#F27500" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Route Distribution Pie Chart */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Booking Distribution by Route
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#F27500"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Train Type and Weekly Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Train Type Distribution */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Bookings by Train Type
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trainTypeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="train_type" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                      <Bar dataKey="bookings" fill="#d96600" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Weekly Averages */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Weekly Average Daily Bookings
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="week" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => `Week of ${new Date(value).toLocaleDateString()}`}
                        formatter={(value) => [value.toLocaleString(), 'Avg Daily Bookings']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avg_daily_bookings" 
                        stroke="#F27500" 
                        strokeWidth={3}
                        dot={{ fill: '#F27500', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Historical vs Predicted Trend */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Historical vs Predicted Booking Trends
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={combinedTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value, name, props) => {
                        if (value === null) return [null, name];
                        
                        const multiplier = props.payload?.holiday_multiplier || props.payload?.seasonal_multiplier;
                        let suffix = '';
                        
                        if (multiplier && multiplier > 2.0) {
                          suffix = ' (Major Holiday)';
                        } else if (multiplier && multiplier > 1.5) {
                          suffix = ' (Holiday Period)';
                        } else if (multiplier && multiplier > 1.2) {
                          suffix = ' (Peak Season)';
                        }
                        
                        return [
                          value.toLocaleString() + suffix, 
                          name === 'actual_bookings' ? 'Actual Bookings' : 'Predicted Bookings'
                        ];
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="actual_bookings" 
                      stroke="#F27500" 
                      strokeWidth={3}
                      name="Actual Bookings"
                      dot={{ fill: '#F27500', strokeWidth: 2, r: 3 }}
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted_bookings" 
                      stroke="#d96600" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      name="Predicted Bookings"
                      dot={{ fill: '#d96600', strokeWidth: 2, r: 3 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 text-sm text-gray-600">
                  <p>• <span className="inline-block w-4 h-0.5 bg-green-500 mr-2"></span>Green line shows actual historical bookings (last 30 days)</p>
                  <p>• <span className="inline-block w-4 h-0.5 bg-blue-500 border-dashed mr-2"></span>Blue dashed line shows predicted future bookings</p>
                </div>
              </div>

              {/* Historical Yearly Trends */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Historical Yearly Trends
                  </h3>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">
                      Year:
                    </label>
                    <select
                      value={historicalYear}
                      onChange={(e) => setHistoricalYear(Number(e.target.value))}
                      className="border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#F27500] focus:border-[#F27500] min-w-[100px] appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundSize: '16px',
                        backgroundPosition: 'right 8px center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      <option value={2016}>2016</option>
                      <option value={2017}>2017</option>
                      <option value={2018}>2018</option>
                      <option value={2019}>2019</option>
                      <option value={2020}>2020</option>
                      <option value={2021}>2021</option>
                      <option value={2022}>2022</option>
                      <option value={2023}>2023</option>
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                    </select>
                  </div>
                </div>
                
                {historicalLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : yearlyHistoricalData ? (
                  <>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={yearlyHistoricalData?.daily_data || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                          interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                          formatter={(value, name, props) => {
                            const day = props.payload;
                            let suffix = '';
                            
                            if (day.holiday_type === 'lebaran') {
                              suffix = ' (Lebaran)';
                            } else if (day.holiday_type === 'lebaran_period') {
                              suffix = ' (Lebaran Period)';
                            } else if (day.holiday_type === 'idul_adha') {
                              suffix = ' (Idul Adha)';
                            } else if (day.holiday_type === 'idul_adha_period') {
                              suffix = ' (Idul Adha Period)';
                            } else if (day.holiday_type === 'christmas') {
                              suffix = ' (Christmas/New Year)';
                            } else if (day.is_weekend) {
                              suffix = ' (Weekend)';
                            }
                            
                            return [value.toLocaleString() + suffix, 'Bookings'];
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="actual_bookings" 
                          stroke="#8b5cf6" 
                          fill="#8b5cf6" 
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-600">Total Bookings</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {yearlyHistoricalData?.summary?.total_bookings?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-600">Daily Average</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {yearlyHistoricalData?.summary?.avg_daily?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-600">Lebaran {historicalYear}</p>
                        <p className="text-lg font-semibold text-purple-600">
                          {yearlyHistoricalData?.lebaran_date ? new Date(yearlyHistoricalData.lebaran_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-600">Idul Adha {historicalYear}</p>
                        <p className="text-lg font-semibold text-purple-600">
                          {yearlyHistoricalData?.idul_adha_date ? new Date(yearlyHistoricalData.idul_adha_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-gray-600">
                      <p>• <span className="inline-block w-4 h-0.5 bg-purple-500 mr-2"></span>Purple area shows actual bookings for {historicalYear}</p>
                      <p>• Hover over peaks to see holiday periods and Lebaran/Idul Adha dates</p>
                      <p>• Use the year dropdown to compare trends across different years</p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-500">
                    <p>Loading historical data...</p>
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Detailed Daily Predictions
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Day of Week
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Predicted Bookings
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Holiday Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dailyChartData.slice(0, Math.min(predictionDays, 30)).map((day, index) => {
                        const multiplier = day.holiday_multiplier || 1.0;
                        let bgClass = '';
                        let holidayStatus = '';
                        
                        if (multiplier > 2.0) {
                          bgClass = 'bg-red-50';
                          holidayStatus = 'Major Holiday';
                        } else if (multiplier > 1.5) {
                          bgClass = 'bg-orange-50';
                          holidayStatus = 'Holiday Period';
                        } else if (multiplier > 1.2) {
                          bgClass = 'bg-yellow-50';
                          holidayStatus = 'Peak Season';
                        } else if (day.is_weekend) {
                          bgClass = 'bg-blue-50';
                          holidayStatus = 'Weekend';
                        } else {
                          holidayStatus = 'Regular Day';
                        }
                        
                        return (
                          <tr key={index} className={bgClass}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {new Date(day.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {day.day_of_week}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {day.predicted_bookings.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                multiplier > 2.0 ? 'bg-red-100 text-red-800' :
                                multiplier > 1.5 ? 'bg-orange-100 text-orange-800' :
                                multiplier > 1.2 ? 'bg-yellow-100 text-yellow-800' :
                                day.is_weekend ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {holidayStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Info */}
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <div className="text-center text-gray-600">
                  <p className="text-sm">
                    Predictions powered by Enhanced ML Model with Islamic Calendar Integration
                  </p>
                  <p className="text-xs mt-2">
                    Model Type: {predictions.model_type} | 
                    Prediction Period: {predictions.prediction_period} | 
                    Historical Range: {predictions.historical_data?.date_range}
                  </p>
                  <p className="text-xs mt-1 text-[#F27500]">
                    Enhanced Gradient Boosting Model (R² = 0.8126) with 63 Features
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    <p className="font-medium">Dynamic Islamic Calendar Features:</p>
                    <p>Christmas/New Year: 2.8x | Lebaran 2025: {predictions.holiday_calendar?.lebaran_2025} | Lebaran 2026: {predictions.holiday_calendar?.lebaran_2026}</p>
                    <p>Idul Adha 2025: {predictions.holiday_calendar?.idul_adha_2025} | Idul Adha 2026: {predictions.holiday_calendar?.idul_adha_2026}</p>
                    <p className="mt-1">ML Model trained with 87,672 records • Islamic calendar calculations • Seasonal patterns • Travel behavior modeling</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderReportTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#F27500]">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          AI Demand Prediction & Operational Readiness
        </h1>
        <p className="text-gray-600 text-sm">
          Enhanced ML Model • 81.26% Accuracy • Islamic Calendar Aware • Last updated: {new Date().toLocaleTimeString('id-ID')}
        </p>
      </div>

      {/* AI Security Insights */}
      {insightsLoading ? (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 font-semibold">Loading AI Security Insights...</span>
          </div>
        </div>
      ) : insightsError ? (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
          <h2 className="text-yellow-800 font-semibold mb-2">AI Insights Unavailable</h2>
          <p className="text-yellow-700 text-sm">{insightsError}</p>
        </div>
      ) : aiInsights ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6">
          <h2 className="text-blue-900 font-semibold mb-3 flex items-center gap-2">
            🤖 AI Security Analysis (Last 24 Hours)
          </h2>

          {/* Summary */}
          <div className="bg-white p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Executive Summary</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{aiInsights.summary}</p>
            <div className="flex gap-4 mt-3 text-xs">
              <span className="text-gray-600">Source: <span className="font-semibold text-blue-600">{aiInsights.source === 'gemini_ai' ? 'Gemini AI' : 'Statistical Analysis'}</span></span>
              <span className="text-gray-600">Sessions: <span className="font-semibold">{aiInsights.stats?.totalSessions || 'N/A'}</span></span>
              <span className="text-gray-600">Bot Rate: <span className="font-semibold text-red-600">{aiInsights.stats?.botRate?.toFixed(1)}%</span></span>
              <span className="text-gray-600">Avg Trust: <span className="font-semibold text-green-600">{aiInsights.stats?.avgTrustScore?.toFixed(1)}%</span></span>
            </div>
          </div>

          {/* Alerts */}
          {aiInsights.alerts && aiInsights.alerts.length > 0 && (
            <div className="bg-red-50 border border-red-300 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-red-900 mb-2">🚨 Security Alerts</h3>
              <ul className="space-y-1">
                {aiInsights.alerts.map((alert, idx) => (
                  <li key={idx} className="text-red-800 text-sm">• {alert}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
            <div className="bg-white p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">💡 Strategic Recommendations</h3>
              <ul className="space-y-2">
                {aiInsights.recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                    <span className="text-blue-600 font-semibold">{idx + 1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Priority Action Items */}
      <div className="bg-red-50 border-2 border-dashed border-red-400 rounded-lg p-6">
        <h2 className="text-red-800 font-semibold mb-4 flex items-center gap-2">
          Priority Action Items (Next 48 Hours)
        </h2>
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-lg flex justify-between items-center">
            <span><strong>Tomorrow 10/4</strong> - Deploy Virtual Queue at 08:30 AM</span>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">CRITICAL</span>
          </div>
          <div className="bg-white p-3 rounded-lg flex justify-between items-center">
            <span><strong>Yogyakarta Route</strong> - Add 2 trains (predicted 110% capacity)</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">HIGH</span>
          </div>
          <div className="bg-white p-3 rounded-lg flex justify-between items-center">
            <span><strong>Staff Allocation</strong> - +18 staff needed at Gambir Station</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">HIGH</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-600 uppercase tracking-wide mb-3">Peak Concurrent Users</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">1,234</div>
          <div className="text-sm text-green-600">+28% vs avg</div>
          <p className="text-xs text-gray-500 mt-2">Tomorrow 10/4 at 09:00-11:00 AM</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-600 uppercase tracking-wide mb-3">Avg Daily Bookings</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">2,690</div>
          <div className="text-sm text-green-600">+12% vs historical</div>
          <p className="text-xs text-gray-500 mt-2">Next 30 days forecast</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-600 uppercase tracking-wide mb-3">Capacity Strain</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">85%</div>
          <div className="text-sm text-red-600">Critical on 3 routes</div>
          <p className="text-xs text-gray-500 mt-2">Yogyakarta, Bandung, Surabaya</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-600 uppercase tracking-wide mb-3">Conversion Pressure</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">HIGH</div>
          <div className="text-sm text-red-600">Sold out in ~2.3hrs</div>
          <p className="text-xs text-gray-500 mt-2">Weekend peak sessions</p>
        </div>
      </div>

      {/* Historical Trends */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">10-Year Historical Trends (2016-2025)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historicalReportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                name
              ]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="bookings" 
              stroke="#F27500" 
              strokeWidth={3}
              name="Annual Bookings"
              dot={{ fill: '#F27500', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="lebaranPeak" 
              stroke="#d96600" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Lebaran Peak"
              dot={{ fill: '#d96600', strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Demand vs Capacity Matrix */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <h3 className="text-lg font-semibold p-6 border-b border-gray-200">
          Demand vs Capacity Matrix (Next 7 Days)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Route</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Predicted Demand</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Available Seats</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Capacity %</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Queue Needed?</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {generateDemandMatrix().slice(0, 10).map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.date}</td>
                  <td className="px-4 py-3">{item.route}</td>
                  <td className="px-4 py-3">{item.predicted.toLocaleString()}</td>
                  <td className="px-4 py-3">{item.capacity.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      item.priority === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.utilizationPct}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.queueNeeded 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.queueNeeded ? 'YES' : 'NO'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {item.priority === 'critical' ? '+2 trains, +12 staff' :
                     item.priority === 'warning' ? '+6 staff' : 'Normal ops'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOperationsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#F27500]">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Real-Time Operations Dashboard
        </h1>
        <p className="text-gray-600 text-sm flex items-center gap-2">
          Live monitoring • Auto-refresh every 5 seconds • 
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            LIVE
          </span>
        </p>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-600 uppercase tracking-wide mb-3">Active Queue</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">{liveStats.activeQueue}</div>
          <div className="text-sm text-green-600">Est. wait: 9m 32s</div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Queue ACTIVE since 08:30 AM
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-600 uppercase tracking-wide mb-3">Active Transactions</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">{liveStats.activeTransactions}</div>
          <div className="text-sm text-green-600">72% conversion rate</div>
          <p className="text-xs text-gray-500 mt-2">Average session: 4m 18s</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-600 uppercase tracking-wide mb-3">🤖 Blocked Bots</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">{liveStats.blockedBots}</div>
          <div className="text-sm text-red-600">Last hour</div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Medium threat level
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-600 uppercase tracking-wide mb-3">Server Load</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">{liveStats.serverLoad}%</div>
          <div className="text-sm text-green-600">HEALTHY</div>
          <p className="text-xs text-gray-500 mt-2">CPU: 62% • Memory: 71% • Latency: 180ms</p>
        </div>
      </div>

      {/* Live Queue Monitor */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <h3 className="text-lg font-semibold p-6 border-b border-gray-200">
          🎫 Live Queue Monitor
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Position</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">User ID</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Route</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Trust Score</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Wait Time</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Device</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { pos: 1, userId: 'U-8472', route: 'Yogyakarta', trust: 98, wait: '0m 12s', device: 'Mobile (iOS)', status: 'processing', trustLevel: 'high' },
                { pos: 2, userId: 'U-9201', route: 'Bandung', trust: 94, wait: '1m 32s', device: 'Desktop (Chrome)', status: 'queue', trustLevel: 'high' },
                { pos: 3, userId: 'U-5538', route: 'Surabaya', trust: 67, wait: '2m 45s', device: 'Mobile (Android)', status: 'monitoring', trustLevel: 'medium' },
                { pos: 4, userId: 'U-1293', route: 'Yogyakarta', trust: 28, wait: '3m 18s', device: 'Desktop (Bot suspected)', status: 'flagged', trustLevel: 'low' },
                { pos: 5, userId: 'U-7654', route: 'Bandung', trust: 91, wait: '4m 02s', device: 'Mobile (iOS)', status: 'queue', trustLevel: 'high' }
              ].map((user) => (
                <tr key={user.pos} className={`hover:bg-gray-50 ${user.status === 'flagged' ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-bold">#{user.pos}</td>
                  <td className="px-4 py-3">{user.userId}</td>
                  <td className="px-4 py-3">{user.route}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.trustLevel === 'high' ? 'bg-green-100 text-green-800' :
                      user.trustLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.trust}
                    </span>
                  </td>
                  <td className="px-4 py-3">{user.wait}</td>
                  <td className="px-4 py-3">{user.device}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      user.status === 'processing' ? 'bg-green-500 animate-pulse' :
                      user.status === 'queue' ? 'bg-green-500 animate-pulse' :
                      user.status === 'monitoring' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}></span>
                    {user.status === 'processing' ? 'Processing' :
                     user.status === 'queue' ? 'In Queue' :
                     user.status === 'monitoring' ? 'Monitoring' :
                     'Flagged'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bot Detection */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">🤖 Real-Time Bot Detection & Trust Scoring</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Time</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">User ID</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Detection Method</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Risk Score</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wide">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { time: '12:47:38', userId: 'U-3421', method: 'Captcha Failed (3x)', risk: 'HIGH', action: '❌ Blocked' },
                { time: '12:47:22', userId: 'U-8812', method: 'Device Fingerprint Mismatch', risk: 'MEDIUM', action: '⚠️ Flagged' },
                { time: '12:47:15', userId: 'U-5590', method: 'Abnormal Mouse Movement', risk: 'MEDIUM', action: '👁️ Monitoring' },
                { time: '12:46:58', userId: 'U-2203', method: 'Multiple Session Detection', risk: 'HIGH', action: '❌ Blocked' }
              ].map((detection, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{detection.time}</td>
                  <td className="px-4 py-3">{detection.userId}</td>
                  <td className="px-4 py-3">{detection.method}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      detection.risk === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {detection.risk}
                    </span>
                  </td>
                  <td className="px-4 py-3">{detection.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Security Insights */}
      {insightsLoading ? (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 font-semibold">Loading AI Security Insights...</span>
          </div>
        </div>
      ) : insightsError ? (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
          <h2 className="text-yellow-800 font-semibold mb-2">AI Insights Unavailable</h2>
          <p className="text-yellow-700 text-sm">{insightsError}</p>
        </div>
      ) : aiInsights ? (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-6">
          <h2 className="text-purple-900 font-semibold mb-3 flex items-center gap-2">
            🤖 AI Security Analysis (Last 24 Hours)
          </h2>

          {/* Summary */}
          <div className="bg-white p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-lg">📊</span> Security Overview
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-3">{aiInsights.summary}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-600">Total Sessions</div>
                <div className="text-lg font-bold text-gray-900">{aiInsights.stats?.totalSessions || 'N/A'}</div>
              </div>
              <div className="bg-red-50 p-2 rounded">
                <div className="text-gray-600">Bot Detection</div>
                <div className="text-lg font-bold text-red-600">{aiInsights.stats?.botRate?.toFixed(1)}%</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="text-gray-600">Avg Trust Score</div>
                <div className="text-lg font-bold text-green-600">{aiInsights.stats?.avgTrustScore?.toFixed(1)}%</div>
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-gray-600">AI Source</div>
                <div className="text-lg font-bold text-blue-600">{aiInsights.source === 'gemini_ai' ? 'Gemini' : 'Stats'}</div>
              </div>
            </div>
          </div>

          {/* Patterns & Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {aiInsights.patterns && aiInsights.patterns.length > 0 && (
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">🔍</span> Detected Patterns
                </h3>
                <ul className="space-y-1">
                  {aiInsights.patterns.slice(0, 3).map((pattern, idx) => (
                    <li key={idx} className="text-gray-700 text-xs flex items-start gap-2">
                      <span className="text-purple-600 font-semibold">•</span>
                      <span>{pattern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiInsights.trends && aiInsights.trends.length > 0 && (
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">📈</span> Security Trends
                </h3>
                <ul className="space-y-1">
                  {aiInsights.trends.slice(0, 3).map((trend, idx) => (
                    <li key={idx} className="text-gray-700 text-xs flex items-start gap-2">
                      <span className="text-blue-600 font-semibold">•</span>
                      <span>{trend}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Alerts */}
          {aiInsights.alerts && aiInsights.alerts.length > 0 && (
            <div className="bg-red-50 border border-red-300 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <span className="text-lg">🚨</span> Critical Alerts
              </h3>
              <ul className="space-y-1">
                {aiInsights.alerts.map((alert, idx) => (
                  <li key={idx} className="text-red-800 text-sm flex items-start gap-2">
                    <span className="font-semibold">⚠️</span>
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
            <div className="bg-white p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-lg">💡</span> AI Recommendations
              </h3>
              <ul className="space-y-2">
                {aiInsights.recommendations.slice(0, 5).map((rec, idx) => (
                  <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                    <span className="text-purple-600 font-semibold">{idx + 1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* System Alerts */}
      <div className="bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-lg p-6">
        <h2 className="text-yellow-800 font-semibold mb-4 flex items-center gap-2">
          ⚡ System Alerts
        </h2>
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-lg flex justify-between items-center">
            <span>🟢 Queue system operating normally - {liveStats.activeQueue} active users</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">HEALTHY</span>
          </div>
          <div className="bg-white p-3 rounded-lg flex justify-between items-center">
            <span>🟡 Yogyakarta route approaching capacity - 89% full</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">WATCH</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['predict', 'report', 'operations'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-[#F27500] text-[#F27500]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'predict' && 'AI Demand Prediction'}
                {tab === 'report' && 'Executive Report'}
                {tab === 'operations' && 'Live Operations'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'predict' && renderPredictTab()}
        {activeTab === 'report' && renderReportTab()}
        {activeTab === 'operations' && renderOperationsTab()}
      </div>
    </div>
  );
}