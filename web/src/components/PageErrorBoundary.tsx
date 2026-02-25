/**
 * Page Error Boundary Component
 *
 * Lightweight error boundary for individual pages
 * Allows the app to continue functioning even if one page crashes
 */

import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { useNavigate } from 'react-router-dom';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
}

const PageErrorFallback: React.FC<{ onReset: () => void; pageName?: string }> = ({
  onReset,
  pageName,
}) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
    onReset();
  };

  const handleGoHome = () => {
    navigate('/');
    onReset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
          <i className="ri-alert-line text-4xl text-orange-600"></i>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Page Error
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 mb-8">
          {pageName
            ? `We encountered an error while loading the ${pageName} page.`
            : 'We encountered an error while loading this page.'}
          <br />
          The rest of the app is working fine.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onReset}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
          >
            <i className="ri-refresh-line mr-2"></i>
            Try Again
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoBack}
              className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Go Back
            </button>

            <button
              onClick={handleGoHome}
              className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300"
            >
              <i className="ri-home-line mr-2"></i>
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ children, pageName }) => {
  return (
    <ErrorBoundary
      name={`page-${pageName || 'unknown'}`}
      fallback={
        <PageErrorFallback onReset={() => window.location.reload()} pageName={pageName} />
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default PageErrorBoundary;
