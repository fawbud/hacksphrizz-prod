'use client';

import { useState } from 'react';

export default function PassengerDetails({ initialData, selectedSeats, onNext, onBack }) {
  const [passengers, setPassengers] = useState(
    initialData || selectedSeats?.map((seat, index) => ({ 
      id: Date.now() + index, 
      ktpNumber: '', 
      fullName: '', 
      type: 'Adult' 
    })) || [{ 
      id: Date.now(), 
      ktpNumber: '', 
      fullName: '', 
      type: 'Adult' 
    }]
  );
  // const [detectionMethod, setDetectionMethod] = useState('rule-based'); // Bot detection toggle - commented out

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      { id: Date.now(), ktpNumber: '', fullName: '', type: 'Adult' },
    ]);
  };

  const removePassenger = (id) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((p) => p.id !== id));
    }
  };

  const updatePassenger = (id, field, value) => {
    // For KTP number, only allow digits and limit to 16 characters
    if (field === 'ktpNumber') {
      value = value.replace(/\D/g, '').slice(0, 16);
    }
    setPassengers(
      passengers.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const testDetectionMethod = async () => {
    try {
      console.log(`🧪 Testing ${detectionMethod} detection method...`);
      
      if (detectionMethod === 'rule-based') {
        const response = await fetch('/api/behavior/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: `passenger_${Date.now()}`,
            behaviors: {
              clicks: Math.floor(Math.random() * 10) + 5,
              keystrokes: Math.floor(Math.random() * 50) + 20,
              mouse_movements: Math.floor(Math.random() * 100) + 50,
              scroll_events: Math.floor(Math.random() * 20) + 10,
              time_on_page: Math.floor(Math.random() * 60000) + 30000,
              tab_switches: Math.floor(Math.random() * 5),
              copy_paste_events: Math.floor(Math.random() * 3),
              right_click_events: Math.floor(Math.random() * 2),
              form_completion_time: Math.floor(Math.random() * 120000) + 60000,
              typing_patterns: {
                avg_interval: Math.floor(Math.random() * 200) + 100,
                variance: Math.floor(Math.random() * 50) + 25
              }
            }
          })
        });
        const result = await response.json();
        console.log('Rule-based result:', result);
        alert(`Rule-based Detection Result: ${result.is_bot ? 'Bot Detected' : 'Human Detected'} (Score: ${result.trust_score}%)`);
      } else {
        const response = await fetch('http://localhost:5001/predict-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: `passenger_${Date.now()}`,
            behaviors: {
              clicks: Math.floor(Math.random() * 10) + 5,
              keystrokes: Math.floor(Math.random() * 50) + 20,
              mouse_movements: Math.floor(Math.random() * 100) + 50,
              scroll_events: Math.floor(Math.random() * 20) + 10,
              time_on_page: Math.floor(Math.random() * 60000) + 30000,
              tab_switches: Math.floor(Math.random() * 5),
              copy_paste_events: Math.floor(Math.random() * 3),
              right_click_events: Math.floor(Math.random() * 2),
              form_completion_time: Math.floor(Math.random() * 120000) + 60000,
              typing_patterns: {
                avg_interval: Math.floor(Math.random() * 200) + 100,
                variance: Math.floor(Math.random() * 50) + 25
              }
            }
          })
        });
        const result = await response.json();
        console.log('AI detection result:', result);
        alert(`AI Detection Result: ${result.prediction === 1 ? 'Bot Detected' : 'Human Detected'} (Confidence: ${(result.confidence * 100).toFixed(1)}%)`);
      }
    } catch (error) {
      console.error(`Error testing ${detectionMethod} detection:`, error);
      alert(`Error testing ${detectionMethod} detection. Check console for details.`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all passengers have required fields
    const allValid = passengers.every(
      (p) => p.ktpNumber.trim() && p.fullName.trim()
    );

    if (!allValid) {
      alert('Please fill in all passenger details');
      return;
    }

    // Validate KTP numbers are 16 digits
    const invalidKTP = passengers.find((p) => p.ktpNumber.length !== 16);
    if (invalidKTP) {
      alert('KTP number must be exactly 16 digits');
      return;
    }

    onNext({ passengers }); // Only pass passengers, removed detectionMethod
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Passenger Details</h2>
      <form onSubmit={handleSubmit}>
        {passengers.map((passenger, index) => (
          <div
            key={passenger.id}
            className="border border-gray-200 rounded-lg p-6 mb-4 relative"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Passenger {index + 1}
              </h3>
              {passengers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePassenger(passenger.id)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KTP Number *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={passenger.ktpNumber}
                  onChange={(e) =>
                    updatePassenger(passenger.id, 'ktpNumber', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27500] focus:border-transparent"
                  placeholder="16 digit KTP number"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {passenger.ktpNumber.length}/16 digits
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={passenger.fullName}
                  onChange={(e) =>
                    updatePassenger(passenger.id, 'fullName', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27500] focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passenger Type *
              </label>
              <select
                value={passenger.type}
                onChange={(e) =>
                  updatePassenger(passenger.id, 'type', e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27500] focus:border-transparent"
              >
                <option value="Adult">Adult</option>
                <option value="Kids">Kids</option>
              </select>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addPassenger}
          className="w-full mb-6 py-3 border-2 border-[#F27500] text-[#F27500] rounded-lg hover:bg-[#F27500] hover:text-white transition-colors font-medium"
        >
          + Add Another Passenger
        </button>

        {/* Bot Detection Method Selection - COMMENTED OUT FOR NOW */}
        {/* 
        <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
          <h3 className="text-lg font-semibold mb-4 text-blue-900">Security Detection Method</h3>
          <p className="text-sm text-blue-700 mb-4">
            Choose the bot detection method for enhanced security during booking:
          </p>
          
          <div className="space-y-3">
            <label className="flex items-center p-3 border-2 border-blue-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-white">
              <input
                type="radio"
                name="detection-method"
                value="rule-based"
                checked={detectionMethod === 'rule-based'}
                onChange={(e) => setDetectionMethod(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div className="ml-3">
                <span className="font-medium text-blue-900">Rule-Based Detection</span>
                <p className="text-xs text-blue-600">Traditional security rules and patterns</p>
              </div>
            </label>

            <label className="flex items-center p-3 border-2 border-blue-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-white">
              <input
                type="radio"
                name="detection-method"
                value="ai"
                checked={detectionMethod === 'ai'}
                onChange={(e) => setDetectionMethod(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div className="ml-3">
                <span className="font-medium text-blue-900">AI-Powered Detection</span>
                <p className="text-xs text-blue-600">Advanced machine learning behavior analysis</p>
              </div>
            </label>
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-blue-800 font-medium">
                  Currently using: {detectionMethod === 'rule-based' ? 'Rule-Based' : 'AI-Powered'} Detection
                </span>
              </div>
              <button
                type="button"
                onClick={testDetectionMethod}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Test Method
              </button>
            </div>
          </div>
        </div>
        */}

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 bg-[#F27500] text-white rounded-lg hover:bg-[#d96600] transition-colors font-medium"
          >
            Continue to Seat Selection
          </button>
        </div>
      </form>
    </div>
  );
}
