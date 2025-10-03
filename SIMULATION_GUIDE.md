# 🚀 Real-time Train Booking Simulation System

## 📋 System Overview

Sistem simulasi ini mensimulasikan kondisi real-world dimana data booking kereta api ditambahkan secara berkala (setiap 5 detik) dan model machine learning di-retrain otomatis dengan data baru. Sistem ini dilengkapi dengan dashboard real-time untuk monitoring dan control.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │  Python Backend │
│  (Dashboard)    │───▶│   (Next.js)     │───▶│   (Simulation)  │
│                 │    │                 │    │                 │
│ • Real-time UI  │    │ • /api/simulation   │ • Data Generation │
│ • Charts        │    │ • /api/prediction   │ • Model Training  │
│ • Controls      │    │                 │    │ • File Management│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Key Features

### 1. **Real-time Data Simulation**
- Generates new booking data every 5 seconds
- Data progression: Oct 3, 2025 → Oct 4, 2025 → etc.
- Realistic booking patterns with holiday integration
- All 8 routes × 3 train types per day

### 2. **Automatic Model Retraining**
- Model retrains sequentially after each data addition
- Uses same hyperparameters (Gradient Boosting)
- Backup original model before simulation starts
- Temporary model stored separately

### 3. **Smart File Management**
- Temporary data: `data/simulation_data.csv`
- Backup model: `models/original_model_backup.pkl`
- Updated model: `models/simulation_model.pkl`
- Status tracking: `simulation_status.json`

### 4. **Interactive Dashboard**
- Real-time status monitoring
- Start/Stop simulation controls
- Fetch latest predictions with updated model
- Charts showing daily predictions and route breakdown

## 🛠️ Technical Implementation

### Core Components

#### 1. **Simulation Script** (`scripts/simulation.py`)
```python
class TrainBookingSimulation:
    - generate_daily_data()     # Creates realistic booking data
    - retrain_model()          # Updates ML model with new data
    - backup_original_model()  # Preserves original state
    - simulation_loop()        # Main 5-second cycle
```

#### 2. **API Routes**
- **`/api/predict`** - Control prediction system (start/stop/status)
- **`/api/prediction`** - Get predictions using latest ML model

#### 3. **Dashboard** (`/simulation`)
- Real-time status updates every 5 seconds
- Interactive charts using Recharts
- Model comparison (original vs simulation)

## 🚀 Usage Instructions

### 1. **Start Prediction System**
```bash
# Via Dashboard
Click "Start Prediction" button

# Via API
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Via Command Line
python scripts/simulation.py start
```

### 2. **Monitor Progress**
- Dashboard shows live updates every 5 seconds
- Status includes: running state, days simulated, current date
- Model status: Original vs Updated

### 3. **Get Updated Predictions**
```bash
# Click "Fetch Latest Predictions" on dashboard
# This uses the newly trained model for predictions
```

### 4. **Stop Simulation**
```bash
# Via Dashboard  
Click "Stop Simulation" button

# This automatically:
# - Stops data generation
# - Restores original model
# - Cleans up temporary files
```

## 📊 Data Flow

### During Simulation:
1. **Timer Trigger** (every 5 seconds)
2. **Data Generation** (Oct 3, Oct 4, Oct 5...)
3. **Data Append** (to simulation_data.csv)
4. **Model Retrain** (with updated dataset)
5. **Status Update** (simulation_status.json)

### Prediction Flow:
1. **User clicks "Fetch"**
2. **API checks** for simulation model
3. **Load appropriate model** (simulation vs original)
4. **Generate predictions** (30 days from latest date)
5. **Display in dashboard** with charts

## 🔧 Configuration

### Data Limits
- **Max rows**: 1000 (keeps recent data for performance)
- **Simulation interval**: 5 seconds
- **Prediction horizon**: 30 days
- **Data progression**: 1 day per cycle

### Model Settings
- **Algorithm**: Gradient Boosting Regressor
- **Hyperparameters**: Same as original (learning_rate=0.15, max_depth=6, n_estimators=200)
- **Features**: 44 engineered features (lag, rolling, seasonal)

## 📈 Generated Visualizations

### Line Graphs (Created)
1. **`2024_monthly_movement.png`** - Monthly booking trends for 2024
2. **`yearly_peak_movement.png`** - Peak day progression 2016-2025
3. **`combined_movement_analysis.png`** - Combined analysis view

### Dashboard Charts (Live)
1. **Daily Predictions Line Chart** - 30-day forecast
2. **Route Breakdown Bar Chart** - Tomorrow's distribution
3. **Summary Cards** - Key metrics and model info

## 🔄 State Management

### File States:
- **Original Data**: `train_booking_data_2016_2025.csv` (unchanged)
- **Simulation Data**: `simulation_data.csv` (temporary, deleted on stop)
- **Original Model**: `demand_prediction_model.pkl` (restored on stop)
- **Backup Model**: `original_model_backup.pkl` (temporary)
- **Updated Model**: `simulation_model.pkl` (temporary, deleted on stop)

### Status Tracking:
```json
{
  "is_running": true,
  "rows_added": 4,
  "last_updated": "2025-10-02T10:30:00",
  "current_date": "2025-10-07",
  "temp_data_file": "data/simulation_data.csv",
  "temp_model_file": "models/simulation_model.pkl"
}
```

## 🎛️ Dashboard Features

### Control Panel
- **Status Indicator**: Green (running) / Red (stopped)
- **Days Simulated**: Counter of progression
- **Current Date**: Shows simulation progress
- **Model Type**: Original vs Updated

### Prediction Display
- **Model Used**: Indicates which model generated predictions
- **Total Bookings**: 30-day sum forecast
- **Peak Day**: Highest predicted day
- **Interactive Charts**: Zoomable line and bar charts

### Auto-refresh
- Status updates every 5 seconds
- Manual prediction refresh via "Fetch" button
- Real-time progress tracking

## 🚨 Error Handling

### Simulation Errors
- Model training failures fallback to previous model
- Data generation errors logged and continue
- API timeouts handled gracefully

### Cleanup on Stop
- All temporary files removed
- Original model restored
- Status files cleared
- Thread termination handled

## 🔗 API Endpoints Reference

### GET `/api/simulation`
Returns current simulation status

### POST `/api/simulation`
```json
{
  "action": "start|stop|status"
}
```

### POST `/api/prediction`
```json
{
  "use_simulation_model": true,
  "prediction_days": 30
}
```

## 🎯 Use Cases

1. **Real-time Model Testing**: Test how model performs with live data
2. **Data Drift Simulation**: Observe model adaptation to new patterns
3. **Performance Monitoring**: Track accuracy changes over time
4. **Demo Purposes**: Show live ML system in action
5. **Development Testing**: Safe environment for model experiments

## 🔮 Future Enhancements

- Model performance tracking over time
- A/B testing between different models
- Alert system for significant accuracy drops
- Export simulation results
- Batch processing capabilities
- Multi-model comparison

---

**🚀 Ready to simulate real-world ML operations!**

Access the dashboard at: `http://localhost:3001/simulation`