'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const CrowdHandlerContext = createContext();

export function CrowdHandlerProvider({ children }) {
  const [isPromoted, setIsPromoted] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gatekeeper, setGatekeeper] = useState(null);

  useEffect(() => {
    const initializeCrowdHandler = async () => {
      try {
        // Only run on client side
        if (typeof window === 'undefined') {
          setIsLoading(false);
          setIsPromoted(true); // Allow SSR to complete
          return;
        }

        // In development mode, skip CrowdHandler entirely for easier testing
        if (process.env.NODE_ENV === 'development') {
          console.log('CrowdHandler: Development mode - skipping queue validation');
          setIsPromoted(true);
          setIsLoading(false);
          return;
        }

        // Dynamic import to avoid SSR issues
        const { init } = await import('crowdhandler-sdk');

        // Initialize CrowdHandler for client-side
        const { gatekeeper: gate } = init({
          publicKey: process.env.NEXT_PUBLIC_CROWDHANDLER_PUBLIC_KEY || '5b945cd137a611051bdeeb272d26ec267875dc11c069b06199678e790160fbfd',
          options: {
            mode: 'clientside',
            debug: process.env.NODE_ENV === 'development',
            liteValidator: false, // Disable lite validator to avoid redirects
            trustOnFail: true, // Allow access if validation fails
          }
        });

        setGatekeeper(gate);

        // Check if user is promoted
        const result = await gate.validateRequest();
        
        if (result.setCookie) {
          gate.setCookie(result.cookieValue, result.domain);
        }

        setIsPromoted(result.promoted || true); // Default to promoted for safety
        
        // Only redirect in production and if specifically required
        if (process.env.NODE_ENV === 'production') {
          if (result.stripParams && result.targetURL) {
            window.location.href = result.targetURL;
            return;
          }

          if (!result.promoted && result.targetURL) {
            // Redirect to waiting room only in production
            window.location.href = result.targetURL;
            return;
          }
        }

        // Record performance if promoted
        if (result.promoted && result.responseID) {
          await gate.recordPerformance();
        }

      } catch (error) {
        console.error('CrowdHandler initialization error:', error);
        // On error, assume promoted (fail-safe)
        setIsPromoted(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCrowdHandler();
  }, []);

  const recordPerformance = async (options = {}) => {
    if (typeof window === 'undefined') return;
    
    if (gatekeeper && isPromoted) {
      try {
        await gatekeeper.recordPerformance(options);
      } catch (error) {
        console.error('Error recording performance:', error);
      }
    }
  };

  const refreshQueueStatus = async () => {
    if (typeof window === 'undefined' || !gatekeeper) return;
    
    try {
      setIsLoading(true);
      const result = await gatekeeper.validateRequest();
      
      if (result.setCookie) {
        gatekeeper.setCookie(result.cookieValue, result.domain);
      }

      setIsPromoted(result.promoted);
      
      if (!result.promoted && result.targetURL) {
        window.location.href = result.targetURL;
      }
    } catch (error) {
      console.error('Error refreshing queue status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isPromoted,
    isLoading,
    gatekeeper,
    recordPerformance,
    refreshQueueStatus,
  };

  return (
    <CrowdHandlerContext.Provider value={value}>
      {children}
    </CrowdHandlerContext.Provider>
  );
}

export function useCrowdHandler() {
  const context = useContext(CrowdHandlerContext);
  if (!context) {
    throw new Error('useCrowdHandler must be used within a CrowdHandlerProvider');
  }
  return context;
}
