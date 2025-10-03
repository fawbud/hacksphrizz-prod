'use client';

import { useCrowdHandler } from '@/context/CrowdHandlerContext';
import { useState, useEffect } from 'react';

export default function QueueTestPage() {
  const { isPromoted, isLoading, refreshQueueStatus, gatekeeper } = useCrowdHandler();
  const [logs, setLogs] = useState([]);
  const [testResult, setTestResult] = useState(null);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog(`Queue status - Promoted: ${isPromoted}, Loading: ${isLoading}`);
  }, [isPromoted, isLoading]);

  const runQueueTest = async () => {
    setTestResult(null);
    addLog('Starting queue validation test...');
    
    try {
      if (!gatekeeper) {
        addLog('ERROR: Gatekeeper not initialized');
        return;
      }

      addLog('Calling gatekeeper.validateRequest()...');
      const result = await gatekeeper.validateRequest();
      
      addLog(`Raw API Response: ${JSON.stringify(result, null, 2)}`);
      addLog(`Promoted: ${result.promoted}`);
      addLog(`Target URL: ${result.targetURL || 'NONE'}`);
      addLog(`Set Cookie: ${result.setCookie}`);
      addLog(`Cookie Value: ${result.cookieValue || 'NONE'}`);
      
      setTestResult(result);
      
      // Don't auto-redirect in test mode, just log what would happen
      if (!result.promoted) {
        addLog('❌ User NOT promoted - should redirect to waiting room');
        if (result.targetURL) {
          addLog(`📍 Should redirect to: ${result.targetURL}`);
        } else {
          addLog('⚠️ WARNING: No targetURL provided by API!');
        }
      } else {
        addLog('✅ User promoted - access granted');
      }
      
    } catch (error) {
      addLog(`ERROR: ${error.message}`);
      addLog(`Error details: ${JSON.stringify(error, null, 2)}`);
      setTestResult({ error: error.message });
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">CrowdHandler Queue Test</h1>
        
        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Queue Status</h3>
            <div className={`text-2xl font-bold ${isPromoted ? 'text-green-600' : 'text-red-600'}`}>
              {isLoading ? 'Loading...' : isPromoted ? 'PROMOTED' : 'IN QUEUE'}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Environment</h3>
            <div className="text-2xl font-bold text-blue-600">
              {process.env.NODE_ENV || 'development'}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">SDK Status</h3>
            <div className={`text-2xl font-bold ${gatekeeper ? 'text-green-600' : 'text-red-600'}`}>
              {gatekeeper ? 'READY' : 'NOT READY'}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">Test Controls</h3>
          <div className="flex gap-4">
            <button
              onClick={runQueueTest}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Test Queue Validation
            </button>
            <button
              onClick={refreshQueueStatus}
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            >
              Refresh Queue Status
            </button>
            <button
              onClick={clearLogs}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-lg font-semibold mb-4">Latest Test Result</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Logs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Debug Logs</h3>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mt-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Testing Instructions</h3>
          <ul className="text-yellow-700 space-y-1">
            <li>• Ensure your CrowdHandler room is enabled with 0/minute rate</li>
            <li>• The status should show &quot;IN QUEUE&quot; if the queue is working</li>
            <li>• Check the test result for detailed API response</li>
            <li>• Look for error messages in the debug logs</li>
            <li>• If promoted=true despite 0/minute rate, there&apos;s a configuration issue</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
