import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for real-time trust score monitoring
 * Subscribes to user_trust table changes and triggers captcha when needed
 *
 * @param {string} userId - The user ID to monitor
 * @param {Object} options - Configuration options
 * @returns {Object} Trust score state and controls
 */
export function useRealtimeTrustScore(userId, options = {}) {
  const {
    captchaThreshold = 0.45, // Show captcha if trust score <= 0.45
    onCaptchaRequired = null,
    onScoreUpdate = null,
    autoFetch = true,
  } = options;

  const [trustState, setTrustState] = useState({
    trustScore: null,
    failedAttempts: 0,
    blockedUntil: null,
    isBlocked: false,
    needsCaptcha: false,
    isLoading: true,
    error: null,
    lastUpdate: null,
  });

  const subscriptionRef = useRef(null);
  const previousScoreRef = useRef(null);

  // Fetch current trust score from database
  const fetchTrustScore = useCallback(async () => {
    if (!userId) {
      console.warn('⚠️ Cannot fetch trust score: No userId');
      return;
    }

    setTrustState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from('user_trust')
        .select('trust_score, failed_attempts, blocked_until, updated_at')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If user not found, create with default trust score
        if (error.code === 'PGRST116') {
          console.log('📝 User not in user_trust table, using defaults');
          const defaultState = {
            trustScore: 0.1, // Default low trust - requires captcha
            failedAttempts: 0,
            blockedUntil: null,
            isBlocked: false,
            needsCaptcha: true, // 0.1 is below threshold, so captcha required
            isLoading: false,
            error: null,
            lastUpdate: null,
          };
          setTrustState(defaultState);
          return;
        }
        throw error;
      }

      const now = new Date();
      const isBlocked = data.blocked_until && new Date(data.blocked_until) > now;
      const needsCaptcha = isBlocked || data.trust_score <= captchaThreshold;

      const newState = {
        trustScore: data.trust_score,
        failedAttempts: data.failed_attempts || 0,
        blockedUntil: data.blocked_until,
        isBlocked,
        needsCaptcha,
        isLoading: false,
        error: null,
        lastUpdate: data.updated_at,
      };

      setTrustState(newState);

      // Trigger callbacks if score changed
      if (previousScoreRef.current !== data.trust_score) {
        console.log('🔄 Trust score updated:', {
          old: previousScoreRef.current,
          new: data.trust_score,
          needsCaptcha,
        });

        if (onScoreUpdate) {
          onScoreUpdate(newState);
        }

        // Trigger captcha callback if needed
        if (needsCaptcha && onCaptchaRequired) {
          onCaptchaRequired(newState);
        }

        previousScoreRef.current = data.trust_score;
      }

    } catch (error) {
      console.error('❌ Failed to fetch trust score:', error);
      setTrustState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
    }
  }, [userId, captchaThreshold, onCaptchaRequired, onScoreUpdate]);

  // Setup real-time subscription
  useEffect(() => {
    if (!userId) return;

    console.log('🔌 Setting up real-time trust score subscription for user:', userId);

    // Initial fetch
    if (autoFetch) {
      fetchTrustScore();
    }

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`user_trust:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_trust',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 Real-time trust score update received:', payload);

          const { new: newRecord, old: oldRecord, eventType } = payload;

          if (eventType === 'DELETE') {
            console.log('🗑️ Trust score record deleted');
            setTrustState({
              trustScore: 0.1,
              failedAttempts: 0,
              blockedUntil: null,
              isBlocked: false,
              needsCaptcha: true, // 0.1 requires captcha
              isLoading: false,
              error: null,
              lastUpdate: null,
            });
            return;
          }

          if (newRecord) {
            const now = new Date();
            const isBlocked = newRecord.blocked_until && new Date(newRecord.blocked_until) > now;
            const needsCaptcha = isBlocked || newRecord.trust_score <= captchaThreshold;

            const updatedState = {
              trustScore: newRecord.trust_score,
              failedAttempts: newRecord.failed_attempts || 0,
              blockedUntil: newRecord.blocked_until,
              isBlocked,
              needsCaptcha,
              isLoading: false,
              error: null,
              lastUpdate: newRecord.updated_at,
            };

            setTrustState(updatedState);

            // Trigger callbacks
            if (onScoreUpdate) {
              onScoreUpdate(updatedState);
            }

            // Auto-trigger captcha if needed and score decreased
            if (needsCaptcha && onCaptchaRequired) {
              const scoreDecreased = oldRecord && newRecord.trust_score < oldRecord.trust_score;
              if (scoreDecreased) {
                console.log('⚠️ Trust score decreased, triggering captcha');
                onCaptchaRequired(updatedState);
              }
            }

            previousScoreRef.current = newRecord.trust_score;
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active for user_trust');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
          setTrustState(prev => ({
            ...prev,
            error: 'Real-time connection failed',
          }));
        }
      });

    subscriptionRef.current = channel;

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up real-time trust score subscription');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [userId, captchaThreshold, onCaptchaRequired, onScoreUpdate, autoFetch, fetchTrustScore]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchTrustScore();
  }, [fetchTrustScore]);

  // Check if captcha should be shown
  const shouldShowCaptcha = useCallback(() => {
    return trustState.needsCaptcha || trustState.isBlocked;
  }, [trustState.needsCaptcha, trustState.isBlocked]);

  // Get trust score percentage for display
  const getTrustPercentage = useCallback(() => {
    if (trustState.trustScore === null || trustState.trustScore === undefined) return null;
    return Math.round(trustState.trustScore * 100);
  }, [trustState.trustScore]);

  // Get trust level category
  const getTrustLevel = useCallback(() => {
    if (trustState.trustScore === null) return 'unknown';
    if (trustState.trustScore >= 0.75) return 'high';
    if (trustState.trustScore >= 0.60) return 'medium_high';
    if (trustState.trustScore >= 0.45) return 'medium';
    if (trustState.trustScore >= 0.30) return 'low';
    return 'very_low';
  }, [trustState.trustScore]);

  return {
    // State
    ...trustState,
    trustLevel: getTrustLevel(),
    trustPercentage: getTrustPercentage(),

    // Controls
    refresh,
    shouldShowCaptcha,
    getTrustPercentage,
    getTrustLevel,

    // Utilities
    isLowTrust: trustState.trustScore !== null && trustState.trustScore <= 0.45,
    isHighTrust: trustState.trustScore !== null && trustState.trustScore >= 0.75,
    hasScore: trustState.trustScore !== null,
  };
}

/**
 * Hook for monitoring captcha requirements based on trust score
 * Automatically shows/hides captcha based on real-time trust score updates
 */
export function useAdaptiveCaptcha(userId, options = {}) {
  const {
    captchaThreshold = 0.45,
    autoShow = true,
    onShow = null,
    onHide = null,
  } = options;

  const [captchaVisible, setCaptchaVisible] = useState(false);

  const trustScore = useRealtimeTrustScore(userId, {
    captchaThreshold,
    onCaptchaRequired: (state) => {
      if (autoShow && !captchaVisible) {
        setCaptchaVisible(true);
        if (onShow) onShow(state);
      }
    },
    onScoreUpdate: (state) => {
      // Auto-hide captcha if trust score improves
      if (captchaVisible && !state.needsCaptcha && !state.isBlocked) {
        setCaptchaVisible(false);
        if (onHide) onHide(state);
      }
    },
  });

  const showCaptcha = useCallback(() => {
    setCaptchaVisible(true);
    if (onShow) onShow(trustScore);
  }, [onShow, trustScore]);

  const hideCaptcha = useCallback(() => {
    setCaptchaVisible(false);
    if (onHide) onHide(trustScore);
  }, [onHide, trustScore]);

  return {
    ...trustScore,
    captchaVisible,
    showCaptcha,
    hideCaptcha,
  };
}
