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

  // Not promoted - should redirect to CrowdHandler waiting room
  // This should only show briefly before redirect happens
  if (isPromoted === false) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Redirecting to Queue...
            </h1>
            <p className="text-gray-600 text-sm">
              Please wait while we redirect you to the waiting room.
            </p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F27500] mx-auto"></div>
            </div>
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
