'use client';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';

function RecommendationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookedTrain, setBookedTrain] = useState(null);

  const trainId = searchParams.get('train');

  useEffect(() => {
    if (!trainId) {
      router.push('/');
      return;
    }
    fetchRecommendedTrains();
  }, [trainId]);

  const fetchRecommendedTrains = async () => {
    setLoading(true);
    setError(null);
    try {
      // First, fetch the booked train details
      const { data: bookedTrainData, error: bookedTrainError } = await supabase
        .from('trains')
        .select('*')
        .eq('id', trainId)
        .single();

      if (bookedTrainError) throw bookedTrainError;
      setBookedTrain(bookedTrainData);

      // Fetch recommendations based on the two criteria
      // Criteria 1: departure_station_code = booked ticket's arrival_station_code && available_seats > 0
      const { data: criteria1Data, error: criteria1Error } = await supabase
        .from('trains')
        .select('*')
        .eq('departure_station_code', bookedTrainData.arrival_station_code)
        .gt('available_seats', 0)
        .eq('is_active', true)
        .order('departure_time', { ascending: true });

      if (criteria1Error) throw criteria1Error;

      // Criteria 2: departure_station_code = booked ticket's departure_station_code && available_seats > 0
      const { data: criteria2Data, error: criteria2Error } = await supabase
        .from('trains')
        .select('*')
        .eq('departure_station_code', bookedTrainData.departure_station_code)
        .gt('available_seats', 0)
        .eq('is_active', true)
        .order('departure_time', { ascending: true });

      if (criteria2Error) throw criteria2Error;

      // Combine and deduplicate results
      const combinedTrains = [...(criteria1Data || []), ...(criteria2Data || [])];
      const uniqueTrains = Array.from(
        new Map(combinedTrains.map(train => [train.id, train])).values()
      );

      setTrains(uniqueTrains);
    } catch (error) {
      console.error('Error fetching recommended trains:', error);
      setError('Failed to load recommended trains. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5);
  };

  const handleViewDetails = (train) => {
    router.push(`/trains?from=${train.departure_station_code}&to=${train.arrival_station_code}&date=2026-01-01&roundTrip=false`);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <section className="max-w-6xl mx-auto px-4 py-8 mt-16">
          {/* Header Section */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-brand hover:text-brand-hover mb-4 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    ✨ Smart Recommendations
                  </h1>
                  {bookedTrain && (
                    <p className="text-gray-600">
                      Based on your booking: <span className="font-semibold">{bookedTrain.train_name}</span> ({bookedTrain.departure_station} → {bookedTrain.arrival_station})
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Looking for recommended trains...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12 bg-white rounded-2xl border border-red-200">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">Error occurred</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchRecommendedTrains}
                className="bg-brand text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-hover transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Trains List */}
          {!loading && !error && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Available Trains ({trains.length})
              </h2>

              {trains.map((train) => (
                <div
                  key={train.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Train Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="inline-block bg-yellow-400 text-white px-3 py-1 rounded-lg text-sm font-semibold mb-2">
                            {train.train_class}
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {train.train_name} ({train.train_code})
                          </h3>
                        </div>

                        {train.available_seats > 0 ? (
                          <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            train.available_seats <= 10
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {train.available_seats <= 10
                              ? `${train.available_seats} Seats Left`
                              : 'Available'}
                          </div>
                        ) : (
                          <div className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-600">
                            Sold Out
                          </div>
                        )}
                      </div>

                      {/* Journey Details */}
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">
                            {formatTime(train.departure_time)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {train.departure_station_code}
                          </div>
                        </div>

                        <div className="flex-1 flex items-center">
                          <div className="w-full border-t-2 border-gray-300 relative">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600 whitespace-nowrap">
                              {train.duration}
                            </div>
                            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">
                            {formatTime(train.arrival_time)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {train.arrival_station_code}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="lg:text-right flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Starting from</div>
                        <div className="text-2xl font-bold text-brand">
                          Rp{train.base_price.toLocaleString('id-ID')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">/ Passenger</div>
                      </div>

                      <button
                        onClick={() => handleViewDetails(train)}
                        className="bg-brand text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-hover transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <details className="mt-4">
                    <summary className="text-brand font-medium cursor-pointer hover:text-brand-hover text-sm">
                      View Subclass Details
                    </summary>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Class</div>
                          <div className="font-semibold text-gray-800">{train.train_class}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Total Seat</div>
                          <div className="font-semibold text-gray-800">{train.total_seats}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Available</div>
                          <div className="font-semibold text-gray-800">{train.available_seats}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Facility</div>
                          <div className="font-semibold text-gray-800">AC, Charging Station, WiFi</div>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              ))}

              {trains.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <div className="text-6xl mb-4">🚄</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No Recommended Trains Available
                  </h3>
                  <p className="text-gray-600">
                    There are no available trains matching your booking route at the moment.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info Footer */}
          <div className="mt-8 bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Important Information
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-brand mt-0.5">•</span>
                <span>These trains are recommended based on your recent booking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand mt-0.5">•</span>
                <span>Click "View Details" to see full schedule and book tickets</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand mt-0.5">•</span>
                <span>Prices shown are base fares per person</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Navbar />
        <div className="text-[#F27500] text-xl">Loading...</div>
      </div>
    }>
      <RecommendationsPageContent />
    </Suspense>
  );
}
