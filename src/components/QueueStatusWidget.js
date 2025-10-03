'use client';

import { useState, useEffect } from 'react';
import { useCrowdHandler } from '@/context/CrowdHandlerContext';

export default function QueueStatusWidget({ 
  showWhenPromoted = false, 
  className = '',
  position = 'top-right' 
}) {
  const { isPromoted, isLoading, refreshQueueStatus } = useCrowdHandler();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show widget when in queue or if showWhenPromoted is true
    setIsVisible(!isLoading && (!isPromoted || showWhenPromoted));
  }, [isPromoted, isLoading, showWhenPromoted]);

  if (!isVisible) return null;

  const baseClasses = `
    fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm
    ${position === 'top-right' ? 'top-4 right-4' : ''}
    ${position === 'top-left' ? 'top-4 left-4' : ''}
    ${position === 'bottom-right' ? 'bottom-4 right-4' : ''}
    ${position === 'bottom-left' ? 'bottom-4 left-4' : ''}
    ${className}
  `;

  return (
    <div className={baseClasses}>
      {isPromoted ? (
        // Promoted status
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Queue: Active</p>
            <p className="text-xs text-green-600">You have access</p>
          </div>
        </div>
      ) : (
        // In queue status
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-orange-800">In Queue</span>
          </div>
          
          <p className="text-xs text-gray-600 mb-3">
            You&apos;re waiting for access due to high demand
          </p>
          
          <button
            onClick={refreshQueueStatus}
            className="w-full bg-orange-500 text-white text-xs px-3 py-2 rounded hover:bg-orange-600 transition-colors"
          >
            Check Status
          </button>
          
          <p className="text-xs text-gray-500 mt-2">
            Auto-refresh in progress...
          </p>
        </div>
      )}
    </div>
  );
}
