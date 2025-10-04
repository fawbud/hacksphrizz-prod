'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCrowdHandler } from '@/context/CrowdHandlerContext';
// Removed problematic hooks causing infinite loop
// import { useBehaviorTracking } from '@/hooks/useBehaviorTracking';
// import { useRealtimeTrustScore } from '@/hooks/useRealtimeTrustScore';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import StepTracker from '@/components/booking/StepTracker';
import PassengerDetails from '@/components/booking/PassengerDetails';
import SeatSelector from '@/components/booking/SeatSelector';
import ExtraProtection from '@/components/booking/ExtraProtection';
import MealAndCab from '@/components/booking/MealAndCab';
import Checkout from '@/components/booking/Checkout';
import AdaptiveCaptcha, { RealtimeTrustScoreDisplay } from '@/components/AdaptiveCaptcha';

const TOTAL_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

function BookingPageContent() {
  const router = useRouter();
  const { recordPerformance } = useCrowdHandler();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriggeredCheckoutAnalysis, setHasTriggeredCheckoutAnalysis] = useState(false);
  const [train, setTrain] = useState(null);
  const [trainLoading, setTrainLoading] = useState(true);
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

  const trainId = searchParams.get('train');
  const selectedDate = searchParams.get('date');

  // Simplified captcha state (hooks removed to fix infinite loop)
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaReason, setCaptchaReason] = useState('');

  // Handle captcha success
  const handleCaptchaSuccess = async () => {
    try {
      console.log('✅ Captcha verification successful');
      setShowCaptcha(false);
      setIsSubmitting(false); // Allow submission to continue
    } catch (error) {
      console.error('Failed to handle captcha success:', error);
      setIsSubmitting(false);
    }
  };

  // Handle captcha error
  const handleCaptchaError = (error) => {
    console.error('❌ Captcha verification failed:', error);
    showToast(`Captcha failed: ${error.message}`, 'error');
  };

  // Removed handleFormSubmission - no longer needed without hooks

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch train details
  useEffect(() => {
    const fetchTrain = async () => {
      if (!trainId) {
        setTrainLoading(false);
        router.push('/trains');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('trains')
          .select('*')
          .eq('id', trainId)
          .single();

        if (error || !data) {
          console.error('Error fetching train:', error);
          alert('Train not found. Redirecting to trains page.');
          router.push('/trains');
          return;
        }
        setTrain(data);
      } catch (err) {
        console.error('Error:', err);
        router.push('/trains');
      } finally {
        setTrainLoading(false);
      }
    };

    fetchTrain();
  }, [trainId, router]);

  // Timer countdown - start after user and train are ready
  useEffect(() => {
    if (authLoading || trainLoading || !user || !train) return;

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
  }, [authLoading, trainLoading, user, train, router]);

  // Make test functions globally available for checkout component
  useEffect(() => {

    // Cleanup on unmount
    return () => {
      delete window.testAnalyzeBehavior;
      delete window.testSimulateBot;
      delete window.testReset;
    };
  }, []);

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateTotal = () => {
    if (!train) return 0;
    let total = train.base_price;
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

  const handleNext = async (data) => {
    // Update booking data first
    setBookingData({ ...bookingData, ...data });

    // Move to next step
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
    setIsSubmitting(true);

    try {
      // Get trust score (default to high trust for now)
      const finalTrustScore = 1.0; // TODO: Implement trust score calculation

      // Proceed with booking completion
      await completeBooking(paymentData, finalTrustScore);

    } catch (error) {
      console.error('Error in booking completion process:', error);
      setIsSubmitting(false);
      alert('An error occurred. Please try again.');
    }
  };


  const completeBooking = async (paymentData, trustScore) => {
    try {
      const finalBookingData = { ...bookingData, payment: paymentData };
      const totalAmount = calculateTotal();
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          train_id: train.id,
          total_amount: totalAmount,
          status: 'completed',
          personal_accident_protection: finalBookingData.protections.personalAccident,
          travel_protection: finalBookingData.protections.travelProtection,
          train_meal: finalBookingData.extras.trainMeal,
          station_cab: finalBookingData.extras.stationCab,
          payment_method: paymentData.paymentMethod,
          payment_details: paymentData.paymentInfo,
          trust_score: trustScore ? Math.round(trustScore * 100) : null,
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Booking error details:', bookingError);
        showToast(`Failed to create booking: ${bookingError.message}`, 'error', 5000);
        return;
      }

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
        console.error('Passengers error details:', passengersError);
        showToast(`Failed to save passenger details: ${passengersError.message}`, 'error', 5000);
        return;
      }

      showToast('Booking completed successfully!', 'success');

      // Record performance for successful booking
      await recordPerformance({
        statusCode: 200,
        sample: 1.0 // Record all successful bookings
      });

      router.push(`/recommendations?train=${train.id}`);
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || trainLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Navbar />
        <div className="text-[#F27500] text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || !train) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Timer and Price Preview */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between md:justify-start md:gap-4">
              <span className="text-gray-600">Time Remaining:</span>
              <span className={`text-2xl font-bold ${timeLeft < 60000 ? 'text-red-600' : 'text-[#F27500]'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex items-center justify-center">
              {/* Trust score display temporarily disabled */}
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
              onBack={handleBack}
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
            <>
              <Checkout
                bookingData={bookingData}
                train={train}
                onComplete={handleComplete}
                onBack={handleBack}
                isSubmitting={isSubmitting}
              />
            </>
          )}
        </div>
      </main>

      {/* Adaptive Captcha with Real-time Trust Score Monitoring */}
      <AdaptiveCaptcha
        userId={user?.id}
        forceVisible={showCaptcha}
        captchaThreshold={0.45}
        reason={captchaReason || "Security verification required"}
        onSuccess={handleCaptchaSuccess}
        onError={handleCaptchaError}
        onClose={() => setShowCaptcha(false)}
      />
      </div>
    </ProtectedRoute>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Navbar />
        <div className="text-[#F27500] text-xl">Loading...</div>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}