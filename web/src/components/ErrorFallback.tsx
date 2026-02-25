/**
 * Error Fallback UI Component
 *
 * User-friendly error page shown when an error boundary catches an error
 */

import React, { ErrorInfo } from 'react';
import { useNavigate } from 'react-router-dom';

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo?: ErrorInfo | null;
  onReset?: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo, onReset }) => {
  const navigate = useNavigate();
  const isDevelopment = import.meta.env.DEV;

  const handleGoHome = () => {
    navigate('/');
    if (onReset) {
      onReset();
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
            <i className="ri-error-warning-line text-5xl text-red-600"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Oops! Something went wrong
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            We encountered an unexpected error. Our team has been notified and is working on a fix.
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {isDevelopment && error && (
          <div className="bg-white rounded-xl border border-red-200 p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <i className="ri-bug-line text-xl text-red-600 mt-0.5"></i>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Error Details</h3>
                <div className="bg-red-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-mono text-red-800 break-all">
                    {error.message}
                  </p>
                </div>
                {error.stack && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-700 font-medium mb-2">
                      Stack Trace
                    </summary>
                    <pre className="bg-gray-100 rounded p-3 overflow-x-auto text-gray-800">
                      {error.stack}
                    </pre>
                  </details>
                )}
                {errorInfo?.componentStack && (
                  <details className="text-xs mt-3">
                    <summary className="cursor-pointer text-gray-700 font-medium mb-2">
                      Component Stack
                    </summary>
                    <pre className="bg-gray-100 rounded p-3 overflow-x-auto text-gray-800">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
            What would you like to do?
          </h3>

          <div className="space-y-3">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              <i className="ri-refresh-line text-xl"></i>
              Try Again
            </button>

            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center gap-3 bg-gray-100 text-gray-900 px-6 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300"
            >
              <i className="ri-home-line text-xl"></i>
              Go to Home Page
            </button>

            <button
              onClick={handleRefresh}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-lg font-semibold hover:border-gray-400 transition-all duration-300"
            >
              <i className="ri-restart-line text-xl"></i>
              Reload Page
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            If this problem persists, please contact our support team.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <a
              href="/help-center"
              className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
            >
              <i className="ri-question-line"></i>
              Help Center
            </a>
            <a
              href="/contact"
              className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
            >
              <i className="ri-mail-line"></i>
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
