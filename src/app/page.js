'use client';

import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import QueueStatusWidget from '@/components/QueueStatusWidget';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#F27500] text-xl">Loading...</div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-white">
      <Navbar />
      <QueueStatusWidget showWhenPromoted={true} />

      {!user ? (
        // Non-logged in user view
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-20 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Book Your Train Tickets <span className="text-[#F27500]">Easily</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Experience seamless train booking with Quikyu. Fast, reliable, and convenient.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/register"
                className="bg-[#F27500] text-white px-8 py-3 rounded-lg text-lg hover:bg-[#d96600] transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="border-2 border-[#F27500] text-[#F27500] px-8 py-3 rounded-lg text-lg hover:bg-[#F27500] hover:text-white transition-colors"
              >
                Login
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 py-16">
            <div className="text-center p-6">
              <div className="text-[#F27500] text-4xl mb-4">🚄</div>
              <h3 className="text-xl font-semibold mb-2">Fast Booking</h3>
              <p className="text-gray-600">Book your tickets in under 2 minutes</p>
            </div>
            <div className="text-center p-6">
              <div className="text-[#F27500] text-4xl mb-4">💺</div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Seat</h3>
              <p className="text-gray-600">Select from a wide range of available seats</p>
            </div>
            <div className="text-center p-6">
              <div className="text-[#F27500] text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Digital Tickets</h3>
              <p className="text-gray-600">Get instant digital tickets on your phone</p>
            </div>
          </div>
        </main>
      ) : (
        // Logged in user view
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back!
            </h1>
            <p className="text-gray-600 mb-8">Ready to book your next journey?</p>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="bg-gradient-to-br from-[#F27500] to-[#d96600] text-white p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">Book a New Ticket</h2>
                <p className="mb-6">Search for trains and book your journey</p>
                <Link href="/book" className="inline-block bg-white text-[#F27500] px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  Book Ticket
                </Link>
              </div>

              <div className="border-2 border-gray-200 p-8 rounded-xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">My Bookings</h2>
                <p className="text-gray-600 mb-6">View and manage your tickets</p>
                <Link href="/bookings" className="inline-block border-2 border-[#F27500] text-[#F27500] px-6 py-2 rounded-lg hover:bg-[#F27500] hover:text-white transition-colors">
                  View Bookings
                </Link>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <button className="bg-white p-4 rounded-lg text-left hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">🎫</div>
                  <div className="font-medium">PNR Status</div>
                </button>
                <button className="bg-white p-4 rounded-lg text-left hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">📍</div>
                  <div className="font-medium">Live Train Status</div>
                </button>
                <button className="bg-white p-4 rounded-lg text-left hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">💰</div>
                  <div className="font-medium">Refunds</div>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
