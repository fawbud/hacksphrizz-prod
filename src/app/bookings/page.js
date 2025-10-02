'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';

export default function BookingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        // Fetch bookings with passengers
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('booking_date', { ascending: false });

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
          setFetchLoading(false);
          return;
        }

        // Fetch passengers for each booking
        const bookingsWithPassengers = await Promise.all(
          bookingsData.map(async (booking) => {
            const { data: passengers, error: passengersError } = await supabase
              .from('booking_passengers')
              .select('*')
              .eq('booking_id', booking.id);

            if (passengersError) {
              console.error('Error fetching passengers:', passengersError);
              return { ...booking, passengers: [] };
            }

            return { ...booking, passengers };
          })
        );

        setBookings(bookingsWithPassengers);
        setFetchLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setFetchLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'credit-card':
        return 'Credit/Debit Card';
      case 'bank-transfer':
        return 'Bank Transfer';
      case 'ewallet':
        return 'E-Wallet';
      default:
        return method;
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleDownloadTicket = (booking) => {
    setSelectedBooking(booking);
    setShowDownloadModal(true);
  };

  if (loading || fetchLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#F27500] text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your train ticket bookings</p>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Bookings Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't made any train bookings. Start your journey today!
            </p>
            <button
              onClick={() => router.push('/booking')}
              className="bg-[#F27500] text-white px-8 py-3 rounded-lg hover:bg-[#d96600] transition-colors font-medium"
            >
              Book a Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">
                          Booking #{booking.id.slice(0, 8)}
                        </h2>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(booking.booking_date)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                      <div className="text-2xl font-bold text-[#F27500]">
                        Rp {parseFloat(booking.total_amount).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Passengers */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Passengers</h3>
                      <div className="space-y-2">
                        {booking.passengers.map((passenger, index) => (
                          <div
                            key={passenger.id}
                            className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium text-gray-900">
                                {passenger.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                KTP: {passenger.ktp_number} • {passenger.passenger_type}
                              </div>
                            </div>
                            <div className="bg-[#F27500] text-white px-3 py-1 rounded font-semibold">
                              {passenger.seat_number}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Booking Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-medium text-gray-900">
                            {getPaymentMethodLabel(booking.payment_method)}
                          </span>
                        </div>

                        {booking.personal_accident_protection && (
                          <div className="flex items-center gap-2 text-green-700">
                            <span>✓</span>
                            <span>Personal Accident Protection</span>
                          </div>
                        )}

                        {booking.travel_protection && (
                          <div className="flex items-center gap-2 text-green-700">
                            <span>✓</span>
                            <span>Travel Protection</span>
                          </div>
                        )}

                        {booking.train_meal && (
                          <div className="flex items-center gap-2 text-blue-700">
                            <span>🍱</span>
                            <span>Train Meal Included</span>
                          </div>
                        )}

                        {booking.station_cab && (
                          <div className="flex items-center gap-2 text-blue-700">
                            <span>🚖</span>
                            <span>Station Cab Booked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDownloadTicket(booking)}
                        className="flex-1 border-2 border-[#F27500] text-[#F27500] px-4 py-2 rounded-lg hover:bg-[#F27500] hover:text-white transition-colors font-medium"
                      >
                        Download Ticket
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* View Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Booking Details"
        size="large"
      >
        {selectedBooking && (
          <div className="space-y-6">
            {/* Booking Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Information</h3>
              <div className="grid md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-sm text-gray-600">Booking ID</p>
                  <p className="font-semibold text-gray-900">{selectedBooking.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Booking Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(selectedBooking.booking_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      selectedBooking.status
                    )}`}
                  >
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-semibold text-[#F27500] text-xl">
                    Rp {parseFloat(selectedBooking.total_amount).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Passengers</h3>
              <div className="space-y-3">
                {selectedBooking.passengers.map((passenger, index) => (
                  <div key={passenger.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Passenger {index + 1}</h4>
                      <div className="bg-[#F27500] text-white px-3 py-1 rounded font-semibold">
                        Seat {passenger.seat_number}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Full Name</p>
                        <p className="font-medium text-gray-900">{passenger.full_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">KTP Number</p>
                        <p className="font-medium text-gray-900">{passenger.ktp_number}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Type</p>
                        <p className="font-medium text-gray-900">{passenger.passenger_type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold text-gray-900">
                    {getPaymentMethodLabel(selectedBooking.payment_method)}
                  </p>
                </div>
                {selectedBooking.payment_details && (
                  <div className="text-sm text-gray-600">
                    <p className="mb-1">Payment Details:</p>
                    <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                      {JSON.stringify(selectedBooking.payment_details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Protection & Extras */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Protection & Extras</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {selectedBooking.personal_accident_protection && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-lg">
                    <span>✓</span>
                    <span className="font-medium">Personal Accident Protection</span>
                  </div>
                )}
                {selectedBooking.travel_protection && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-lg">
                    <span>✓</span>
                    <span className="font-medium">Travel Protection</span>
                  </div>
                )}
                {selectedBooking.train_meal && (
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 p-3 rounded-lg">
                    <span>🍱</span>
                    <span className="font-medium">Train Meal Included</span>
                  </div>
                )}
                {selectedBooking.station_cab && (
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 p-3 rounded-lg">
                    <span>🚖</span>
                    <span className="font-medium">Station Cab Booked</span>
                  </div>
                )}
              </div>
              {!selectedBooking.personal_accident_protection &&
                !selectedBooking.travel_protection &&
                !selectedBooking.train_meal &&
                !selectedBooking.station_cab && (
                  <p className="text-gray-500 text-sm">No additional services selected</p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleDownloadTicket(selectedBooking);
                }}
                className="flex-1 bg-[#F27500] text-white px-6 py-3 rounded-lg hover:bg-[#d96600] transition-colors font-medium"
              >
                Download Ticket
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Download Success Modal */}
      <Modal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        title="Download Successful"
        size="small"
      >
        <div className="text-center py-6">
          <div className="text-6xl mb-4">✓</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Ticket Downloaded!</h3>
          <p className="text-gray-600 mb-6">
            Your ticket has been successfully downloaded and saved to your device.
          </p>
          {selectedBooking && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Booking ID</p>
              <p className="font-semibold text-gray-900">{selectedBooking.id.slice(0, 8)}</p>
            </div>
          )}
          <button
            onClick={() => setShowDownloadModal(false)}
            className="w-full bg-[#F27500] text-white px-6 py-3 rounded-lg hover:bg-[#d96600] transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
