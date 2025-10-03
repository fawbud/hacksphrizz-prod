'use client';

import { useEffect } from 'react';

export default function EmergencyBypass() {
  useEffect(() => {
    // Check for emergency bypass parameter
    const urlParams = new URLSearchParams(window.location.search);
    const bypassQueue = urlParams.get('bypass_queue');
    
    if (bypassQueue === 'emergency_2024') {
      // Set emergency bypass cookie
      document.cookie = 'crowdhandler_bypass=true; max-age=3600; path=/';
      
      // Remove the parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      console.log('Emergency queue bypass activated');
    }
  }, []);

  return null; // This component doesn't render anything
}
