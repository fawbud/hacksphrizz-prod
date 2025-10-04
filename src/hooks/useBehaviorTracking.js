import { useState, useCallback, useRef, useEffect } from 'react';
import { BehaviorTracker } from '@/utils/behaviorTracker';

/**
 * React hook for comprehensive user behavior tracking and trust score management
 * @param {string} userId - The user ID to track
 * @param {Object} options - Configuration options
 * @returns {Object} Tracking state and controls
 */
export function useBehaviorTracking(userId, options = {}) {
  const {
    autoStart = true,
    sendInterval = 30000, // 30 seconds
    onTrustScoreUpdate = null,
    onCaptchaRequired = null,
    trackingEnabled = true,
  } = options;

  const [trackingState, setTrackingState] = useState({
    isTracking: false,
    isLoading: false,
    currentTrustScore: null, // Will be set ONLY when analysis is triggered
    trustLevel: 'Unknown',
    needsCaptcha: false,
    lastUpdate: null,
    error: null,
    confidence: 0,
    reasons: [],
    trackingData: null,
    hasAnalyzed: false, // NEW: Track if analysis has been done
  });

  const trackerRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSendRef = useRef(0);
  const fetchTrustScoreRef = useRef(null); // Ref to avoid circular dependency

  // Fetch current trust score from server - defined early to avoid hoisting issues
  const fetchCurrentTrustScore = useCallback(async () => {
    if (!userId) {
      console.warn('⚠️ Cannot fetch trust score: No userId');
      return;
    }

    console.log('🔍 Fetching current trust score from server...');

    try {
      const response = await fetch(`/api/behavior/track?userId=${encodeURIComponent(userId)}`);
      const result = await response.json();

      if (result.success) {
        // Validate trustScore before setting
        const trustScore = result.trustScore !== null && result.trustScore !== undefined
          ? parseFloat(result.trustScore)
          : null;

        if (trustScore !== null && isNaN(trustScore)) {
          console.error('❌ Fetched trustScore is NaN:', result.trustScore);
          return;
        }

        console.log('✅ Trust score fetched:', trustScore);

        setTrackingState(prev => ({
          ...prev,
          currentTrustScore: trustScore,
          trustLevel: result.trustLevel || 'Unknown',
          needsCaptcha: result.needsCaptcha || false,
          lastUpdate: result.lastUpdated,
        }));
      } else {
        console.warn('⚠️ Fetch trust score failed:', result);
      }
    } catch (error) {
      console.error('❌ Failed to fetch trust score:', error);
    }
  }, [userId]);

  // Store in ref for access in callbacks
  useEffect(() => {
    fetchTrustScoreRef.current = fetchCurrentTrustScore;
  }, [fetchCurrentTrustScore]);

  // Initialize tracker (will be called after startTracking/stopTracking are defined)
  useEffect(() => {
    if (!userId || !trackingEnabled) return;

    try {
      trackerRef.current = new BehaviorTracker(userId);

      if (autoStart && !trackingState.isTracking) {
        // Start tracking directly without calling startTracking function
        trackerRef.current.startTracking();
        setTrackingState(prev => ({ ...prev, isTracking: true, error: null }));
      }

      // DON'T fetch initial trust score automatically!
      // Score should only be fetched when explicitly requested (e.g., on checkout)
      // fetchCurrentTrustScore(); // DISABLED - only fetch on demand

    } catch (error) {
      console.error('Failed to initialize behavior tracker:', error);
      setTrackingState(prev => ({
        ...prev,
        error: 'Failed to initialize tracking'
      }));
    }

    return () => {
      // Cleanup: stop tracking directly
      if (trackerRef.current) {
        trackerRef.current.stopTracking();
      }
      setTrackingState(prev => ({ ...prev, isTracking: false }));
    };
  }, [userId, trackingEnabled, autoStart, fetchCurrentTrustScore]);

  // Start behavior tracking
  const startTracking = useCallback(() => {
    if (!trackerRef.current || trackingState.isTracking) return;

    try {
      trackerRef.current.startTracking();
      setTrackingState(prev => ({ ...prev, isTracking: true, error: null }));

      // Set up periodic sending
      if (sendInterval > 0) {
        intervalRef.current = setInterval(() => {
          sendBehaviorData();
        }, sendInterval);
      }

      // Set up periodic data updates for UI
      const dataUpdateInterval = setInterval(() => {
        if (trackerRef.current) {
          const currentData = trackerRef.current.getTrackingData();
          setTrackingState(prev => ({ ...prev, trackingData: currentData }));
        }
      }, 2000); // Update every 2 seconds

      // Store the data update interval for cleanup
      trackerRef.current.dataUpdateInterval = dataUpdateInterval;

      console.log('Behavior tracking started for user:', userId);
    } catch (error) {
      console.error('Failed to start tracking:', error);
      setTrackingState(prev => ({
        ...prev,
        error: 'Failed to start tracking'
      }));
    }
  }, [trackingState.isTracking, sendInterval, userId]);

  // Stop behavior tracking
  const stopTracking = useCallback(() => {
    if (!trackerRef.current || !trackingState.isTracking) return;

    try {
      // Send final data before stopping
      sendBehaviorData(true);

      trackerRef.current.stopTracking();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Clean up data update interval
      if (trackerRef.current.dataUpdateInterval) {
        clearInterval(trackerRef.current.dataUpdateInterval);
        trackerRef.current.dataUpdateInterval = null;
      }

      setTrackingState(prev => ({ ...prev, isTracking: false, trackingData: null }));
      console.log('Behavior tracking stopped');
    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  }, [trackingState.isTracking]);

  // Send behavior data to server for analysis
  const sendBehaviorData = useCallback(async (isForced = false) => {
    console.log('🔥 [TRACE] sendBehaviorData called', { isForced, userId, hasTracker: !!trackerRef.current });

    if (!trackerRef.current || !userId) {
      console.warn('⚠️ Cannot send: No tracker or userId');
      return null;
    }

    // Prevent too frequent sends unless forced
    const now = Date.now();
    const timeSinceLastSend = now - lastSendRef.current;
    console.log('🔥 [TRACE] Time since last send:', timeSinceLastSend, 'ms');

    if (!isForced && timeSinceLastSend < 10000) { // Minimum 10 seconds between sends
      console.log('⏱️ Skipping send: Too frequent (< 10s since last send)');
      return null;
    }

    console.log('🔥 [TRACE] Proceeding with send - calling sendToServer...');
    setTrackingState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await trackerRef.current.sendToServer(isForced);
      console.log('📥 Received result from sendToServer:', result);
      lastSendRef.current = now;

      // Handle beacon response (doesn't have trustScore)
      if (result && result.method === 'beacon') {
        console.log('📡 Beacon response - fetching trust score from server...');
        setTrackingState(prev => ({ ...prev, isLoading: false }));

        // Beacon was sent successfully, but we need to fetch the trust score
        if (result.success) {
          // Wait a bit for server to process, then fetch
          setTimeout(() => {
            if (fetchTrustScoreRef.current) {
              fetchTrustScoreRef.current();
            }
          }, 500);
        }

        return result;
      }

      // Validate result has trustScore
      if (result && result.success) {
        if (typeof result.trustScore === 'undefined') {
          console.error('❌ Result missing trustScore:', result);
          throw new Error('Invalid response: trustScore is undefined');
        }

        console.log('✅ Valid result with trustScore:', result.trustScore);

        // Validate trustScore is a valid number
        const trustScore = parseFloat(result.trustScore);
        if (isNaN(trustScore)) {
          console.error('❌ trustScore is NaN:', result.trustScore);
          throw new Error('Invalid trustScore: not a number');
        }

        const newState = {
          currentTrustScore: trustScore,
          trustLevel: result.trustLevel || 'Unknown',
          needsCaptcha: result.needsCaptcha || false,
          lastUpdate: new Date().toISOString(),
          confidence: result.confidence || 0,
          reasons: result.reasons || [],
          error: null,
          isLoading: false,
          hasAnalyzed: true, // Mark that analysis has been completed
        };

        console.log('✅ Trust score updated in state:', newState);
        setTrackingState(prev => ({ ...prev, ...newState }));

        // Trigger callbacks
        if (onTrustScoreUpdate) {
          onTrustScoreUpdate(result);
        }

        if (result.needsCaptcha && onCaptchaRequired) {
          onCaptchaRequired(result);
        }

        return result;
      } else {
        const errorMsg = result?.error || result?.message || 'Failed to send behavior data';
        console.error('❌ Send failed:', errorMsg, result);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Failed to send behavior data:', error);
      setTrackingState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
      return null;
    }
  }, [userId, onTrustScoreUpdate, onCaptchaRequired]); // fetchCurrentTrustScore causes circular dependency, handled via ref

  // Force immediate analysis and scoring
  const analyzeNow = useCallback(async () => {
    console.log('🔥 [TRACE] analyzeNow() called - forcing immediate analysis');
    console.log('🔥 [TRACE] Current tracking state:', {
      currentTrustScore: trackingState.currentTrustScore,
      trustLevel: trackingState.trustLevel,
      lastUpdate: trackingState.lastUpdate
    });

    const result = await sendBehaviorData(true);
    console.log('🔥 [TRACE] analyzeNow() result:', result);
    return result;
  }, [sendBehaviorData, trackingState]);

  // Update game metrics (for backward compatibility)
  const updateGameMetrics = useCallback((gameData) => {
    if (trackerRef.current) {
      trackerRef.current.updateGameData(gameData);
    }
  }, []);

  // Get current tracking metrics
  const getTrackingMetrics = useCallback(() => {
    if (!trackerRef.current) return null;
    return trackerRef.current.getTrackingData();
  }, []);

  // Reset tracking data
  const resetData = useCallback(() => {
    if (!trackerRef.current) return;
    
    try {
      trackerRef.current.resetData();
      setTrackingState(prev => ({
        ...prev,
        currentTrustScore: null,
        trustLevel: 'Unknown',
        needsCaptcha: false,
        error: null,
        confidence: null,
        reasons: [],
        lastUpdate: null
      }));
      console.log('🔄 Behavior tracking data reset from hook');
    } catch (error) {
      console.error('Failed to reset tracking data:', error);
    }
  }, []);

  return {
    // State
    isTracking: trackingState.isTracking,
    isLoading: trackingState.isLoading,
    currentTrustScore: trackingState.currentTrustScore,
    trustLevel: trackingState.trustLevel,
    needsCaptcha: trackingState.needsCaptcha,
    lastUpdate: trackingState.lastUpdate,
    error: trackingState.error,
    confidence: trackingState.confidence,
    reasons: trackingState.reasons,

    // Controls
    startTracking,
    stopTracking,
    sendBehaviorData,
    analyzeNow,
    fetchCurrentTrustScore,
    updateGameMetrics,
    getTrackingMetrics,
    resetData,

    // Data access
    data: trackingState.trackingData, // Expose tracking data from state

    // Utils
    isLowTrust: trackingState.currentTrustScore !== null && trackingState.currentTrustScore <= 0.5,
    isHighTrust: trackingState.currentTrustScore !== null && trackingState.currentTrustScore >= 0.8,
    trustScorePercentage: trackingState.currentTrustScore ? Math.round(trackingState.currentTrustScore * 100) : null,
  };
}

/**
 * Hook for managing captcha state based on trust score
 */
export function useCaptchaManager(userId) {
  const [captchaState, setCaptchaState] = useState({
    isVisible: false,
    isLoading: false,
    error: null,
    attempts: 0,
  });

  const showCaptcha = useCallback((reason = 'Trust score verification required') => {
    setCaptchaState(prev => ({
      ...prev,
      isVisible: true,
      error: null,
    }));
    console.log('Captcha required:', reason);
  }, []);

  const hideCaptcha = useCallback(() => {
    setCaptchaState(prev => ({
      ...prev,
      isVisible: false,
      error: null,
    }));
  }, []);

  const onCaptchaSuccess = useCallback(async () => {
    setCaptchaState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Here you would typically verify the captcha with your backend
      // and update the trust score
      
      // For now, just hide the captcha
      hideCaptcha();
      
      console.log('Captcha verification successful');
    } catch (error) {
      setCaptchaState(prev => ({
        ...prev,
        error: 'Captcha verification failed',
        isLoading: false,
        attempts: prev.attempts + 1,
      }));
    }
  }, [hideCaptcha]);

  const onCaptchaError = useCallback((error) => {
    setCaptchaState(prev => ({
      ...prev,
      error: error.message || 'Captcha error',
      attempts: prev.attempts + 1,
    }));
  }, []);

  return {
    // State
    isVisible: captchaState.isVisible,
    isLoading: captchaState.isLoading,
    error: captchaState.error,
    attempts: captchaState.attempts,

    // Controls
    showCaptcha,
    hideCaptcha,
    onCaptchaSuccess,
    onCaptchaError,

    // Utils
    shouldShowCaptcha: captchaState.isVisible,
    maxAttemptsReached: captchaState.attempts >= 3,
  };
}