import { useState } from 'react';

/**
 * Captcha Placeholder Component
 * This will be replaced with actual captcha implementation later
 */
export default function CaptchaPlaceholder({ 
  onSuccess, 
  onError, 
  onClose, 
  isVisible = false,
  trustScore = null,
  reason = "Please verify that you're human"
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleVerify = async () => {
    setIsLoading(true);
    setAttempts(prev => prev + 1);

    // Simulate captcha verification delay
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate for demo
      
      if (success) {
        onSuccess?.();
      } else {
        onError?.(new Error('Verification failed. Please try again.'));
      }
      
      setIsLoading(false);
    }, 1500);
  };

  const handleClose = () => {
    setAttempts(0);
    onClose?.();
  };

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

        {/* Trust Score Display */}
        {trustScore !== null && !isNaN(trustScore) && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  Trust Score: {Math.round(trustScore * 100)}%
                </p>
                <p className="text-xs text-yellow-600">
                  Verification required for security
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reason */}
        <p className="text-gray-600 mb-6 text-center">
          {reason}
        </p>

        {/* Captcha Placeholder */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            CAPTCHA Implementation Placeholder
          </p>
          <p className="text-xs text-gray-400">
            This will be replaced with actual captcha service<br />
            (reCAPTCHA, hCaptcha, or custom implementation)
          </p>
        </div>

        {/* Attempts Info */}
        {attempts > 0 && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-500">
              Attempt {attempts}/3
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={isLoading || attempts >= 3}
            className="flex-1 px-4 py-2 bg-[#F27500] text-white rounded-lg hover:bg-[#d96600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : attempts >= 3 ? (
              'Max Attempts Reached'
            ) : (
              'Verify Human'
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            This verification helps protect against automated access
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Trust Score Display Component
 * Shows current trust score and status
 */
export function TrustScoreDisplay({
  trustScore,
  trustLevel,
  confidence,
  className = ""
}) {
  // Validate trustScore is a valid number
  if (trustScore === null || trustScore === undefined || isNaN(trustScore)) {
    return null;
  }

  const percentage = Math.round(trustScore * 100);
  const confidencePercentage = confidence && !isNaN(confidence) ? Math.round(confidence * 100) : null;

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score) => {
    if (score >= 0.8) return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
    if (score >= 0.5) return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${getScoreColor(trustScore)} ${className}`}>
      {getScoreIcon(trustScore)}
      <span className="font-medium">Trust: {percentage}%</span>
      {confidencePercentage && (
        <span className="text-xs opacity-75">({confidencePercentage}% conf.)</span>
      )}
    </div>
  );
}