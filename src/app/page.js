'use client';

import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import QueueStatusWidget from '@/components/QueueStatusWidget';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      number: 1,
      title: "AI Traffic Prediction",
      description: "Historical data analysis predicts ticket surges, accounting for holidays, discounts, and special events to proactively prepare the system."
    },
    {
      number: 2,
      title: "Smart Waiting Room Activation",
      description: "Virtual waiting room activates when thresholds are met with DNS-level redirect to high-load servers, keeping the main system stable."
    },
    {
      number: 3,
      title: "Trust Score Assessment",
      description: "Initial trust score calculated on entry. Low-trust users (≤0.5) get captcha challenge in waiting room to prevent bots from reaching the form."
    },
    {
      number: 4,
      title: "Form Interaction Analysis",
      description: "AI monitors user behavior during multi-page form completion, analyzing mouse movements, typing patterns, and interaction timing."
    },
    {
      number: 5,
      title: "Final Verification & Booking",
      description: "Final trust score determines if additional verification needed. Seamless completion for humans, friction for bots, with zero downtime."
    }
  ];

  // ✅ Auto redirect kalau sudah login
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-brand text-xl">Loading...</div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-brand to-brand-hover text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              No more hassle, <br /> easier than ever!
            </h1>
            <p className="text-lg mb-8 max-w-xl">
              Quikyu is here to revolutionize train ticket booking: faster, easier, and fairer for all Indonesian passengers.
            </p>
            <div className="flex gap-4 justify-center lg:justify-start">
              <Link
                href="/register"
                className="bg-white text-brand px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Demo Now
              </Link>
              <Link
                href="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-white hover:text-brand transition-colors"
              >
                Login
              </Link>
            </div>
          </div>

          {/* Card Gambar Hero */}
          <div className="flex-1 mt-12 lg:mt-0 flex justify-center">
            <div className="max-w-lg rounded-2xl overflow-hidden shadow-xl border border-gray-100">
              <Image
                src="/hero-train.jpg"
                alt="Kereta Api Indonesia"
                width={600}
                height={400}
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why <span className="text-brand">us</span>?
        </h2>

        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div className="p-6 rounded-lg bg-gray-50 shadow hover:shadow-lg transition">
            <div className="text-5xl mb-4">🚄</div>
            <h3 className="text-xl font-semibold mb-2">Fast and Reliable</h3>
            <p className="text-gray-600">No more server downtime. Book tickets with comfort.</p>
          </div>
          <div className="p-6 rounded-lg bg-gray-50 shadow hover:shadow-lg transition">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">Smart Bot-Detection</h3>
            <p className="text-gray-600">Fair system with seamless UX for happy customers</p>
          </div>
          <div className="p-6 rounded-lg bg-gray-50 shadow hover:shadow-lg transition">
            <div className="text-5xl mb-4">🧩</div>
            <h3 className="text-xl font-semibold mb-2">Easy Integration</h3>
            <p className="text-gray-600">Plug-and-play, no system-breaking changes</p>
          </div>
          <div className="p-6 rounded-lg bg-gray-50 shadow hover:shadow-lg transition">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Secure and Trusted</h3>
            <p className="text-gray-600">Minimal-to-zero user data collection required</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-r from-red-600 to-brand text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-center text-white/90 mb-16 max-w-2xl mx-auto">
            Experience seamless train ticket booking with our intelligent multi-layer system
          </p>

          {/* Carousel Container */}
          <div className="relative">
            {/* Left Button */}
            <button
              onClick={prevStep}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 border border-white/30 transition-all"
              aria-label="Previous step"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Cards Container */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentStep * 100}%)` }}
              >
                {steps.map((step, index) => (
                  <div key={index} className="min-w-full px-4">
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20 hover:bg-white/15 transition-all">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-brand text-3xl font-bold mb-8 mx-auto">
                          {step.number}
                        </div>
                        <h3 className="text-3xl font-bold mb-6 text-center">{step.title}</h3>
                        <p className="text-white/90 leading-relaxed text-lg text-center">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Button */}
            <button
              onClick={nextStep}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 border border-white/30 transition-all"
              aria-label="Next step"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-3 mt-8">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}
