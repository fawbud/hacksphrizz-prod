'use client';

import { useState, useCallback } from 'react';
import { useCrowdHandler } from '@/context/CrowdHandlerContext';

export function useCrowdHandlerAPI() {
  const { isPromoted, recordPerformance } = useCrowdHandler();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(async (url, options = {}) => {
    // Only check promotion status on client side
    if (typeof window !== 'undefined' && isPromoted === false) {
      throw new Error('Access denied: Please wait in the queue');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Queue protection is active
          const data = await response.json();
          throw new Error(data.message || 'Service temporarily unavailable');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Record performance for successful API calls (only on client side)
      if (typeof window !== 'undefined' && recordPerformance) {
        await recordPerformance({
          statusCode: response.status,
          sample: 0.3 // Sample 30% of successful API calls
        });
      }

      return data;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isPromoted, recordPerformance]);

  const get = useCallback((url, options = {}) => {
    return makeRequest(url, { ...options, method: 'GET' });
  }, [makeRequest]);

  const post = useCallback((url, data, options = {}) => {
    return makeRequest(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  const put = useCallback((url, data, options = {}) => {
    return makeRequest(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  const del = useCallback((url, options = {}) => {
    return makeRequest(url, { ...options, method: 'DELETE' });
  }, [makeRequest]);

  return {
    loading,
    error,
    makeRequest,
    get,
    post,
    put,
    delete: del,
    clearError: () => setError(null),
  };
}

// Specific hook for demand forecasting
export function useDemandForecast() {
  const api = useCrowdHandlerAPI();

  const getForecast = useCallback(async (date, route, passengers = 1) => {
    try {
      const data = await api.post('/api/demand/forecast', {
        date,
        route,
        passengers
      });
      return data;
    } catch (error) {
      console.error('Demand forecast error:', error);
      throw error;
    }
  }, [api]);

  return {
    ...api,
    getForecast,
  };
}
