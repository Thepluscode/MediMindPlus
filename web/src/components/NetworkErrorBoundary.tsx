/**
 * Network Error Boundary Component
 *
 * Specialized error boundary for network/API errors
 * Provides retry functionality and offline detection
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from '../utils/logger';

interface NetworkErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

interface NetworkErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isOnline: boolean;
}

class NetworkErrorBoundary extends Component<
  NetworkErrorBoundaryProps,
  NetworkErrorBoundaryState
> {
  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isOnline: navigator.onLine,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<NetworkErrorBoundaryState> {
    // Only catch network-related errors
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to load') ||
      error.name === 'NetworkError'
    ) {
      return {
        hasError: true,
        error,
      };
    }
    // Re-throw non-network errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Network error caught', {
      service: 'network-error-boundary',
      error: error.message,
      stack: error.stack,
      isOnline: this.state.isOnline,
    });
  }

  componentDidMount(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = (): void => {
    this.setState({ isOnline: true });
  };

  handleOffline = (): void => {
    this.setState({ isOnline: false });
  };

  handleRetry = (): void => {
    const { onRetry } = this.props;

    this.setState(
      {
        hasError: false,
        error: null,
      },
      () => {
        if (onRetry) {
          onRetry();
        } else {
          window.location.reload();
        }
      }
    );
  };

  render(): ReactNode {
    const { hasError, error, isOnline } = this.state;
    const { children } = this.props;

    if (hasError && error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              {isOnline ? (
                <i className="ri-wifi-off-line text-4xl text-blue-600"></i>
              ) : (
                <i className="ri-signal-wifi-off-line text-4xl text-red-600"></i>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {isOnline ? 'Connection Issue' : 'No Internet Connection'}
            </h2>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              {isOnline
                ? 'We're having trouble connecting to our servers. Please try again.'
                : 'It looks like you're offline. Please check your internet connection and try again.'}
            </p>

            {/* Retry Button */}
            <button
              onClick={this.handleRetry}
              disabled={!isOnline}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                isOnline
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <i className="ri-refresh-line mr-2"></i>
              {isOnline ? 'Try Again' : 'Waiting for Connection...'}
            </button>

            {/* Status */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}
              ></div>
              <span className="text-gray-600">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default NetworkErrorBoundary;
