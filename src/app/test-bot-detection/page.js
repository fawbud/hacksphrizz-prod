import BotDetectionToggle from '../components/BotDetectionToggle';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Bot Detection Test Environment
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Compare Rule-Based vs AI-powered bot detection systems. 
            Move your mouse, click buttons, and type to generate behavioral data for analysis.
          </p>
        </div>

        <BotDetectionToggle />

        {/* Test Area */}
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            🎮 Interactive Test Area
          </h3>
          <p className="text-gray-600 mb-6">
            Use this area to generate behavioral data. Your interactions will be tracked and analyzed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mouse Movement Area */}
            <div className="p-6 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300">
              <h4 className="font-semibold text-blue-800 mb-3">🖱️ Mouse Movement Test</h4>
              <div className="h-32 bg-blue-100 rounded-lg flex items-center justify-center cursor-crosshair">
                <p className="text-blue-600">Move your mouse around this area</p>
              </div>
            </div>

            {/* Click Test Area */}
            <div className="p-6 bg-green-50 rounded-lg border-2 border-dashed border-green-300">
              <h4 className="font-semibold text-green-800 mb-3">👆 Click Test</h4>
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                  Click Me
                </button>
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                  And Me
                </button>
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                  Try This
                </button>
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                  Last One
                </button>
              </div>
            </div>

            {/* Typing Test Area */}
            <div className="p-6 bg-purple-50 rounded-lg border-2 border-dashed border-purple-300">
              <h4 className="font-semibold text-purple-800 mb-3">⌨️ Typing Test</h4>
              <textarea
                className="w-full h-24 p-3 border border-purple-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Type something here to generate keystroke data..."
              />
            </div>

            {/* Form Interaction Test */}
            <div className="p-6 bg-orange-50 rounded-lg border-2 border-dashed border-orange-300">
              <h4 className="font-semibold text-orange-800 mb-3">📝 Form Interaction Test</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  className="w-full p-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your name"
                />
                <select className="w-full p-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>Select an option</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Test Controls */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">🎛️ Additional Test Controls</h4>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
                Normal Button
              </button>
              <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                Red Button
              </button>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors">
                Yellow Button
              </button>
              <button className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors">
                Indigo Button
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            📊 Method Comparison
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Feature</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">📊 Rule-Based</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">🧠 AI Model</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-medium">Detection Method</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">Predefined rules</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">Machine Learning</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium">Features Analyzed</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">Basic patterns</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">62 advanced features</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-medium">Performance</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">Fast & lightweight</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">Higher accuracy</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium">Bot Detection Rate</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">~95%</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">100% (in tests)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-medium">Resource Usage</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">Low</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">Medium</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}