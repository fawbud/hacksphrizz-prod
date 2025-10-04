import { useState, useEffect } from 'react';

/**
 * Adaptive Captcha Component - Simplified Version
 * Shows captcha based on forceVisible prop
 */
export default function AdaptiveCaptcha({
  userId,
  onSuccess,
  onError,
  onClose,
  forceVisible = false,
  captchaThreshold = 0.45,
  reason = "Please verify that you're human"
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [localVisible, setLocalVisible] = useState(forceVisible);

  // Sync forceVisible prop with local state
  useEffect(() => {
    setLocalVisible(forceVisible);
  }, [forceVisible]);

  const handleVerify = async () => {
    setIsLoading(true);
    setAttempts(prev => prev + 1);

    try {
      // Simulate verification (replace with actual reCAPTCHA)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Call success callback
      onSuccess?.();
      setLocalVisible(false);
      setAttempts(0);
    } catch (error) {
      console.error('Captcha verification failed:', error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAttempts(0);
    setLocalVisible(false);
    onClose?.();
  };

  const isVisible = forceVisible || localVisible;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Security Verification
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Reason */}
        <p className="text-sm text-gray-600 mb-4">{reason}</p>

        {/* Captcha Placeholder */}
        <div className="bg-gray-100 rounded-lg p-8 mb-4 text-center">
          <p className="text-gray-500 mb-4">Captcha verification would appear here</p>
          <button
            onClick={handleVerify}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {/* Attempts counter */}
        {attempts > 0 && (
          <p className="text-xs text-gray-500 text-center">
            Attempt {attempts}/5
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Real-time Trust Score Display Component
 * Disabled - returns null
 */
export function RealtimeTrustScoreDisplay({ userId, className = "" }) {
  return null;
}
