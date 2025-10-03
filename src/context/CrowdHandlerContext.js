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

        // Check for emergency bypass (only for critical emergencies)
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

        // Initialize CrowdHandler for client-side with proper production settings
        const { gatekeeper: gate } = init({
          publicKey: process.env.NEXT_PUBLIC_CROWDHANDLER_PUBLIC_KEY || '5b945cd137a611051bdeeb272d26ec267875dc11c069b06199678e790160fbfd',
          options: {
            mode: 'full', // Use full mode for proper queue validation
            debug: false, // Disable debug in production
            liteValidator: false, // Disable lite validator to avoid redirects
            trustOnFail: false, // Don't trust on fail - enforce queue properly
          }
        });

        setGatekeeper(gate);

        console.log('CrowdHandler: Validating request...');

        // Check if user is promoted - this will respect dashboard settings
        const result = await gate.validateRequest();
        
        console.log('CrowdHandler validation result:', {
          promoted: result.promoted,
          setCookie: result.setCookie,
          targetURL: result.targetURL
        });

        if (result.setCookie) {
          gate.setCookie(result.cookieValue, result.domain);
        }

        // Respect the actual result from CrowdHandler API
        setIsPromoted(result.promoted);
        
        // Handle redirects properly in production
        if (!result.promoted) {
          if (result.targetURL && 
              result.targetURL !== window.location.href && 
              !result.targetURL.includes(window.location.hostname) &&
              result.targetURL.startsWith('https://wait.crowdhandler.com/')) {
            
            console.log('CrowdHandler: User not promoted, redirecting to waiting room:', result.targetURL);
            window.location.href = result.targetURL;
            return;
          } else {
            console.warn('CrowdHandler: No valid waiting room URL provided, but user not promoted');
            // In this case, we should show a local queue message instead of allowing access
            setIsPromoted(false);
          }
        } else {
          console.log('CrowdHandler: User promoted, allowing access');
        }

        // Record performance if promoted
        if (result.promoted && result.responseID) {
          await gate.recordPerformance();
        }

      } catch (error) {
        console.error('CrowdHandler initialization error:', error);
        
        // In production, if CrowdHandler fails and queue is active, we should be cautious
        // Only allow access if we're sure it's safe
        if (process.env.NODE_ENV === 'production') {
          console.warn('CrowdHandler failed in production - defaulting to queue protection');
          setIsPromoted(false); // Default to queue protection in production
        } else {
          setIsPromoted(true); // Allow access in development
        }
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
