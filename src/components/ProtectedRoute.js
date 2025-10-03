'use client';

import { useEffect, useState } from 'react';
import { useCrowdHandler } from '@/context/CrowdHandlerContext';

export default function ProtectedRoute({ children, fallback = null, showLoadingScreen = true }) {
  const { isPromoted, isLoading, refreshQueueStatus } = useCrowdHandler();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle server-side rendering
  if (!mounted) {
    return showLoadingScreen ? (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F27500] mx-auto mb-4"></div>
          <div className="text-[#F27500] text-xl">Checking queue status...</div>
        </div>
      </div>
    ) : null;
  }

  // Loading state
  if (isLoading) {
    return showLoadingScreen ? (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F27500] mx-auto mb-4"></div>
          <div className="text-[#F27500] text-xl">Checking queue status...</div>
          <p className="text-gray-600 mt-2">This may take a moment...</p>
        </div>
      </div>
    ) : (fallback || null);
  }

  // Not promoted - show waiting message or custom fallback
  if (isPromoted === false) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-6xl mb-6">⏳</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Virtual Queue Active
            </h1>
            <p className="text-gray-600 mb-6">
              Due to high demand, you&apos;ve been placed in our virtual queue. 
              Please wait while we prepare your access to ensure the best experience.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-orange-800 text-sm font-medium">
                🔒 Queue Protection Active
              </p>
              <p className="text-orange-600 text-sm mt-1">
                This helps us maintain service quality during peak times
              </p>
            </div>
            <button
              onClick={refreshQueueStatus}
              className="bg-[#F27500] text-white px-8 py-3 rounded-lg hover:bg-[#d96600] transition-colors font-medium"
            >
              Check Queue Status
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Your position will be automatically updated. Please keep this page open.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Promoted - render children
  if (isPromoted === true) {
    return children;
  }

  // Unknown state - show loading
  return showLoadingScreen ? (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F27500] mx-auto mb-4"></div>
        <div className="text-[#F27500] text-xl">Loading...</div>
      </div>
    </div>
  ) : (fallback || null);
}
