/**
 * Loading Fallback Component
 *
 * Loading UI shown while lazy-loaded components are being fetched
 */

import React from 'react';

interface LoadingFallbackProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Loading...',
  fullScreen = true
}) => {
  const containerClass = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <div className="text-center">
        {/* Animated Logo/Icon */}
        <div className="mb-6 flex items-center justify-center">
          <div className="relative">
            {/* Outer spinning ring */}
            <div className="w-20 h-20 border-4 border-teal-200 rounded-full animate-spin border-t-teal-600"></div>

            {/* Inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center">
                <i className="ri-brain-line text-white text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {message}
        </h3>
        <p className="text-sm text-gray-600">
          Please wait a moment
        </p>

        {/* Loading Dots Animation */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;
