'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCrowdHandler } from '@/context/CrowdHandlerContext';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import StepTracker from '@/components/booking/StepTracker';
import PassengerDetails from '@/components/booking/PassengerDetails';
import SeatSelector from '@/components/booking/SeatSelector';
import ExtraProtection from '@/components/booking/ExtraProtection';
import MealAndCab from '@/components/booking/MealAndCab';
import Checkout from '@/components/booking/Checkout';

const TOTAL_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

export default function BookingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { recordPerformance } = useCrowdHandler();
  const [currentStep, setCurrentStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [bookingData, setBookingData] = useState({
    passengers: [],
    selectedSeats: [],
    protections: {
      personalAccident: false,
      travelProtection: false,
    },
    extras: {
      trainMeal: false,
      stationCab: false,
    },
    payment: null,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          alert('Time expired! Redirecting to home page.');
          router.push('/');
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateTotal = () => {
    let total = 150000; // Base ticket price per passenger
    total *= bookingData.passengers.length || 0;

    if (bookingData.protections.personalAccident) {
      total += 15000 * (bookingData.passengers.length || 0);
    }
    if (bookingData.protections.travelProtection) {
      total += 25000 * (bookingData.passengers.length || 0);
    }
    if (bookingData.extras.trainMeal) {
      total += 45000 * (bookingData.passengers.length || 0);
    }
    if (bookingData.extras.stationCab) {
      total += 35000;
    }

    return total;
  };

  const handleNext = (data) => {
    setBookingData({ ...bookingData, ...data });
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleStepClick = (step) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handleComplete = async (paymentData) => {
    try {
      const finalBookingData = { ...bookingData, payment: paymentData };
      const totalAmount = calculateTotal();

      // Insert booking into database
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          status: 'completed',
          personal_accident_protection: finalBookingData.protections.personalAccident,
          travel_protection: finalBookingData.protections.travelProtection,
          train_meal: finalBookingData.extras.trainMeal,
          station_cab: finalBookingData.extras.stationCab,
          payment_method: paymentData.paymentMethod,
          payment_details: paymentData.paymentInfo,
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        alert('Failed to create booking. Please try again.');
        return;
      }

      // Insert passengers for this booking
      const passengersToInsert = finalBookingData.passengers.map((passenger, index) => ({
        booking_id: booking.id,
        ktp_number: passenger.ktpNumber,
        full_name: passenger.fullName,
        passenger_type: passenger.type,
        seat_number: finalBookingData.selectedSeats[index] || '',
      }));

      const { error: passengersError } = await supabase
        .from('booking_passengers')
        .insert(passengersToInsert);

      if (passengersError) {
        console.error('Error creating passengers:', passengersError);
        alert('Failed to save passenger details. Please contact support.');
        return;
      }

      alert('Booking completed successfully!');
      
      // Record performance for successful booking
      await recordPerformance({
        statusCode: 200,
        sample: 1.0 // Record all successful bookings
      });
      
      router.push('/');
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('An error occurred. Please try again.');
    }
  };

  if (loading) {
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
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Timer and Price Preview */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between md:justify-start md:gap-4">
              <span className="text-gray-600">Time Remaining:</span>
              <span className={`text-2xl font-bold ${timeLeft < 60000 ? 'text-red-600' : 'text-[#F27500]'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex items-center justify-between md:justify-end md:gap-4">
              <span className="text-gray-600">Total Price:</span>
              <span className="text-2xl font-bold text-[#F27500]">
                Rp {calculateTotal().toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Step Tracker */}
        <StepTracker currentStep={currentStep} onStepClick={handleStepClick} />

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 mt-6">
          {currentStep === 1 && (
            <PassengerDetails
              initialData={bookingData.passengers}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <SeatSelector
              passengers={bookingData.passengers}
              initialData={bookingData.selectedSeats}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <ExtraProtection
              initialData={bookingData.protections}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && (
            <MealAndCab
              initialData={bookingData.extras}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 5 && (
            <Checkout
              bookingData={bookingData}
              onComplete={handleComplete}
              onBack={handleBack}
            />
          )}
        </div>
      </main>
      </div>
    </ProtectedRoute>
  );
}
