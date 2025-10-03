'use client';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [from, setFrom] = useState('Gambir');
  const [fromCode, setFromCode] = useState('GMR');
  const [to, setTo] = useState('Yogyakarta');
  const [toCode, setToCode] = useState('YK');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  // Function to swap departure and destination
  const handleSwap = () => {
    const tempCity = from;
    const tempCode = fromCode;
    setFrom(to);
    setFromCode(toCode);
    setTo(tempCity);
    setToCode(tempCode);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Build query parameters
    const params = new URLSearchParams({
      from: fromCode,
      to: toCode,
      date: date,
      roundTrip: isRoundTrip.toString(),
    });
    
    if (isRoundTrip && returnDate) {
      params.append('returnDate', returnDate);
    }
    
    router.push(`/trains?${params.toString()}`);
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      {/* Hero Section with Search Form */}
      <section className="relative pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Welcome, {user?.user_metadata?.first_name || 'Penumpang'} 👋
            </h1>
            <p className="text-gray-600 text-lg">
              Try out our train ticket booking system!
            </p>
          </div>

          {/* Search Card - Inspired by the image */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🚄</span>
              Find Train Tickets
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trip Type Toggle */}
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setIsRoundTrip(false)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    !isRoundTrip
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  One Way
                </button>
                <button
                  type="button"
                  onClick={() => setIsRoundTrip(true)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    isRoundTrip
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Return
                </button>
              </div>

              {/* Route Selection with Swap Button */}
              <div className="relative">
                <div className="grid gap-4">
                  {/* Departure */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      From
                    </label>
                    <select
                      value={`${from}|${fromCode}`}
                      onChange={(e) => {
                        const [city, code] = e.target.value.split('|');
                        setFrom(city);
                        setFromCode(code);
                      }}
                      className="w-full text-lg font-semibold bg-transparent border-none outline-none text-gray-800"
                      required
                    >
                      <option value="Gambir|GMR">Gambir (GMR)</option>
                      <option value="Yogyakarta|YK">Yogyakarta (YK)</option>
                      <option value="Bandung|BD">Bandung (BD)</option>
                      <option value="Surabaya Pasar Turi|SBI">Surabaya Pasar Turi (SBI)</option>
                    </select>
                  </div>

                  {/* Swap Button - Positioned between inputs */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <button
                      type="button"
                      onClick={handleSwap}
                      className="bg-white border-2 border-brand rounded-full p-3 hover:shadow-lg hover:bg-gray-50 transition transform hover:rotate-180 duration-300"
                      aria-label="Tukar stasiun"
                    >
                      <svg
                        className="w-5 h-5 text-brand"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Destination */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      To
                    </label>
                    <select
                      value={`${to}|${toCode}`}
                      onChange={(e) => {
                        const [city, code] = e.target.value.split('|');
                        setTo(city);
                        setToCode(code);
                      }}
                      className="w-full text-lg font-semibold bg-transparent border-none outline-none text-gray-800"
                      required
                    >
                      <option value="Yogyakarta|YK">Yogyakarta (YK)</option>
                      <option value="Gambir|GMR">Gambir (GMR)</option>
                      <option value="Bandung|BD">Bandung (BD)</option>
                      <option value="Surabaya Pasar Turi|SBI">Surabaya Pasar Turi (SBI)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div className={`grid gap-4 ${isRoundTrip ? 'md:grid-cols-2' : ''}`}>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={today}
                    className="w-full text-lg font-semibold bg-transparent border-none outline-none text-gray-800"
                    required
                  />
                </div>

                {isRoundTrip && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Return Date
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={date || today}
                      className="w-full text-lg font-semibold bg-transparent border-none outline-none text-gray-800"
                      required={isRoundTrip}
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-brand text-white py-4 rounded-xl font-semibold text-lg hover:bg-brand-hover transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🔍 Find Schedule
              </button>
            </form>
          </div>

          {/* Quick Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
              <div className="text-3xl mb-3">💪</div>
              <h3 className="font-semibold text-gray-800 mb-1">No More Downtime</h3>
              <p className="text-sm text-gray-600">With smart dynamic waiting rooms</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-gray-800 mb-1">Fair and Square</h3>
              <p className="text-sm text-gray-600">No more competing against pesky bots</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="font-semibold text-gray-800 mb-1">Zero Compromise</h3>
              <p className="text-sm text-gray-600">Enjoy the benefits with zero tradeoff</p>
            </div>
          </div>

          {/* My Bookings Button */}
          <div className="mt-12 text-center">
            <button
              onClick={() => router.push('/dashboard/my-bookings')}
              className="bg-white text-brand px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-2 border-brand"
            >
              🎫 View My Bookings
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}