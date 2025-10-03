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

        // Check for emergency bypass
        const bypassCookie = document.cookie.includes('crowdhandler_bypass=true');
        if (bypassCookie) {
          console.log('CrowdHandler: Emergency bypass detected');
          setIsPromoted(true);
          setIsLoading(false);
          return;
        }

        // In development mode, skip CrowdHandler entirely for easier testing
        if (process.env.NODE_ENV === 'development') {
          console.log('CrowdHandler: Development mode - skipping queue validation');
          setIsPromoted(true);
          setIsLoading(false);
          return;
        }

        // Check if we're already in a redirect loop
        const currentUrl = window.location.href;
        if (currentUrl.includes('%2F') || currentUrl.includes('https%3A') || currentUrl.length > 200) {
          console.warn('CrowdHandler: Redirect loop detected, bypassing queue');
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

        setIsPromoted(result.promoted !== false); // Default to promoted unless explicitly false
        
        // IMPORTANT: Prevent redirect loops by checking URLs
        if (process.env.NODE_ENV === 'production' && result.promoted === false) {
          // Only redirect if we have a valid waiting room URL and it's different from current
          if (result.targetURL && 
              result.targetURL !== window.location.href && 
              !result.targetURL.includes(window.location.hostname) &&
              result.targetURL.startsWith('https://wait.crowdhandler.com/')) {
            
            console.log('CrowdHandler: Redirecting to waiting room:', result.targetURL);
            window.location.href = result.targetURL;
            return;
          } else {
            console.warn('CrowdHandler: Invalid redirect URL, allowing access');
            setIsPromoted(true);
          }
        }

        // Record performance if promoted
        if (result.promoted !== false && result.responseID) {
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
