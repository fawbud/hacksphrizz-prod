'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function SimulationDashboard() {
  const [simulationStatus, setSimulationStatus] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Fetch simulation status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/predict');
      const data = await response.json();
      setSimulationStatus(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch simulation status');
      console.error('Status fetch error:', err);
    }
  };

  // Start simulation
  const startSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      const data = await response.json();
      if (data.success) {
        setError(null);
        await fetchStatus();
      } else {
        setError(data.error || 'Failed to start simulation');
      }
    } catch (err) {
      setError('Failed to start simulation');
      console.error('Start simulation error:', err);
    }
    setLoading(false);
  };

  // Stop simulation
  const stopSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      
      const data = await response.json();
      if (data.success) {
        setError(null);
        await fetchStatus();
        setPredictions(null); // Clear predictions when simulation stops
      } else {
        setError(data.error || 'Failed to stop simulation');
      }
    } catch (err) {
      setError('Failed to stop simulation');
      console.error('Stop simulation error:', err);
    }
    setLoading(false);
  };

  // Fetch predictions with latest model
  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const useSimulationModel = simulationStatus?.status?.temp_model_file ? true : false;
      
      const response = await fetch('/api/prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          use_simulation_model: useSimulationModel,
          prediction_days: 30 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setPredictions(data.predictions);
        setLastFetch(new Date());
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch predictions');
      }
    } catch (err) {
      setError('Failed to fetch predictions');
      console.error('Fetch predictions error:', err);
    }
    setLoading(false);
  };

  // Auto-refresh status every 5 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Format chart data
  const chartData = predictions?.daily_predictions?.slice(0, 30).map(item => ({
    date: new Date(item.date).toLocaleDateString('id-ID', { 
      month: 'short', 
      day: 'numeric' 
    }),
    bookings: item.total_bookings,
    dayOfWeek: item.day_of_week
  })) || [];

  // Get route breakdown for current week
  const routeData = predictions?.route_breakdown
    ?.filter((_, index) => index < 8 * 3) // First day, all routes and train types
    ?.reduce((acc, item) => {
      const existing = acc.find(r => r.route === item.route);
      if (existing) {
        existing.bookings += item.predicted_bookings;
      } else {
        acc.push({
          route: item.route.split('-').map(s => s.substring(0, 3)).join('-'),
          bookings: item.predicted_bookings
        });
      }
      return acc;
    }, []) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 Real-time Simulation Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor live data generation and model retraining for train booking demand prediction
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-600">❌</div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Simulation Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Status</h3>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  simulationStatus?.status?.is_running ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`font-semibold ${
                  simulationStatus?.status?.is_running ? 'text-green-700' : 'text-red-700'
                }`}>
                  {simulationStatus?.status?.is_running ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>

            {/* Rows Added */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Days Simulated</h3>
              <p className="text-2xl font-bold text-blue-600">
                {simulationStatus?.status?.rows_added || 0}
              </p>
            </div>

            {/* Current Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Current Date</h3>
              <p className="text-sm font-semibold text-gray-900">
                {simulationStatus?.status?.current_date || 'Not started'}
              </p>
            </div>

            {/* Model Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Model</h3>
              <p className="text-sm font-semibold text-gray-900">
                {simulationStatus?.status?.temp_model_file ? 'Updated' : 'Original'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={startSimulation}
              disabled={loading || simulationStatus?.status?.is_running}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? '⏳ Starting...' : '▶️ Start Simulation'}
            </button>

            <button
              onClick={stopSimulation}
              disabled={loading || !simulationStatus?.status?.is_running}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? '⏳ Stopping...' : '⏹️ Stop Simulation'}
            </button>

            <button
              onClick={fetchPredictions}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? '⏳ Fetching...' : '🔄 Fetch Latest Predictions'}
            </button>
          </div>
        </div>

        {/* Predictions Dashboard */}
        {predictions && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Model Used</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {predictions.model_type === 'simulation' ? 'Updated' : 'Original'}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Predictions</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {predictions.summary?.total_predicted_bookings?.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Daily Bookings</h3>
                <p className="text-2xl font-bold text-green-600">
                  {predictions.summary?.avg_daily_bookings?.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Peak Day</h3>
                <p className="text-lg font-bold text-orange-600">
                  {new Date(predictions.summary?.peak_day).toLocaleDateString('id-ID')}
                </p>
                <p className="text-sm text-gray-600">
                  {predictions.summary?.peak_bookings?.toLocaleString()} bookings
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Daily Predictions Line Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    📈 Daily Booking Predictions (30 Days)
                  </h3>
                  {lastFetch && (
                    <span className="text-xs text-gray-500">
                      Updated: {lastFetch.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [value.toLocaleString(), 'Bookings']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="bookings" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Route Breakdown Bar Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🚂 Route Breakdown (Tomorrow)
                </h3>
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={routeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="route" 
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [value.toLocaleString(), 'Bookings']}
                    />
                    <Bar dataKey="bookings" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Prediction Period Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Prediction Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Prediction Period</h4>
                  <p className="text-sm text-gray-900">{predictions.prediction_period}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Total Days</h4>
                  <p className="text-sm text-gray-900">{predictions.total_days} days</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Data Source</h4>
                  <p className="text-sm text-gray-900">
                    {predictions.model_type === 'simulation' ? 'Live simulation data' : 'Historical data'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Instructions */}
        {!predictions && (
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">🎯 How to Use</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Click <strong>"Start Simulation"</strong> to begin real-time data generation</li>
              <li>Watch as new data is added every 5 seconds and model retrains automatically</li>
              <li>Click <strong>"Fetch Latest Predictions"</strong> to get predictions using the updated model</li>
              <li>Monitor the dashboard for real-time insights and predictions</li>
              <li>Click <strong>"Stop Simulation"</strong> to end and cleanup all temporary data</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}