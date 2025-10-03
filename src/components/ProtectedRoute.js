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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            You&apos;re in the queue
          </h1>
          <p className="text-gray-600 mb-6">
            Due to high demand, you&apos;ve been placed in a virtual queue. 
            Please wait while we prepare your access.
          </p>
          <button
            onClick={refreshQueueStatus}
            className="bg-[#F27500] text-white px-6 py-3 rounded-lg hover:bg-[#d96600] transition-colors"
          >
            Check Status
          </button>
          <p className="text-sm text-gray-500 mt-4">
            This page will automatically refresh when it&apos;s your turn.
          </p>
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
